import { 
  users, 
  simulations, 
  organizations, 
  plans,
  payments,
  sessions,
  type User, 
  type InsertUser, 
  type Simulation, 
  type InsertSimulation, 
  type Organization, 
  type InsertOrganization,
  type Plan,
  type InsertPlan,
  type Payment,
  type InsertPayment,
  type Session,
  type InsertSession
} from "@shared/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "./db";
import { eq, and, desc, count, gte } from "drizzle-orm";
import { 
  SOLAR_SIMULATION_CONFIG, 
  getSolarIrradiation, 
  getRegionalFactor, 
  calculateRequiredPower, 
  calculatePanelCount,
  getInvestmentScenarios
} from '@shared/simulation-config';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  
  // Password reset operations
  createResetToken(email: string): Promise<string | null>;
  verifyResetToken(token: string): Promise<User | null>;
  updatePassword(userId: number, hashedPassword: string): Promise<boolean>;
  clearResetToken(userId: number): Promise<void>;
  
  // Session operations
  createSession(userId: number): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  cleanExpiredSessions(): Promise<void>;
  
  // Plan operations
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, metadata?: any): Promise<Payment | undefined>;
  
  // Plan verification
  checkUserPlanAccess(userId: number): Promise<{ hasAccess: boolean; plan: string; remainingSimulations?: number }>;
  upgradeUserPlan(userId: number, plan: string, expiresAt?: Date): Promise<User | undefined>;
  
  // Simulation operations
  getSimulation(id: number): Promise<Simulation | undefined>;
  getSimulationsByUser(userId: number): Promise<Simulation[]>;
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  updateSimulation(id: number, simulation: Partial<InsertSimulation>): Promise<Simulation | undefined>;
  deleteSimulation(id: number): Promise<boolean>;
  
  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  
  // Stats operations
  getUserStats(userId: number): Promise<{
    totalSimulations: number;
    activeProjects: number;
    totalSavings: number;
    totalPower: number;
  }>;
  
  // Calculate simulation with improved algorithm
  calculateSimulationResults(simulation: Simulation): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultPlans();
  }

  private async initializeDefaultPlans() {
    try {
      // Check if plans already exist
      const existingPlans = await this.getPlans();
      if (existingPlans.length > 0) return;

      // Create Free Plan
      await this.createPlan({
        name: "gratuito",
        displayName: "Plano Gratuito",
        price: 0,
        currency: "BRL",
        maxSimulations: 5,
        features: [
          "Acesso limitado às simulações",
          "Módulo residencial básico", 
          "Relatórios simplificados"
        ],
        isActive: true,
      });

      // Create Premium Plan
      await this.createPlan({
        name: "premium",
        displayName: "Plano Premium",
        price: 24.90,
        currency: "BRL",
        maxSimulations: -1, // unlimited
        features: [
          "Simulações ilimitadas",
          "Todos os módulos disponíveis",
          "Relatórios profissionais completos",
          "Assistente IA especializado",
          "Suporte prioritário",
          "Análises avançadas"
        ],
        isActive: true,
      });
    } catch (error) {
      console.log('Plans already initialized or error:', error);
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Password reset operations
  async createResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.updateUser(user.id, {
      resetToken: token,
      resetTokenExpiresAt: expiresAt
    });

    return token;
  }

  async verifyResetToken(token: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.resetToken, token),
        gte(users.resetTokenExpiresAt, new Date())
      )
    );
    return user || null;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        hashedPassword, 
        resetToken: null, 
        resetTokenExpiresAt: null 
      })
      .where(eq(users.id, userId));
    return true;
  }

  async clearResetToken(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        resetToken: null, 
        resetTokenExpiresAt: null 
      })
      .where(eq(users.id, userId));
  }

  // Session operations
  async createSession(userId: number): Promise<Session> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [session] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId,
        expiresAt
      })
      .returning();

    await this.updateUserLastLogin(userId);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    return session || undefined;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, sessionId));
    return true;
  }

  async cleanExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(
      gte(sessions.expiresAt, new Date())
    );
  }

  // Plan operations
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans);
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan || undefined;
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db
      .insert(plans)
      .values({
        name: plan.name,
        displayName: plan.displayName,
        price: plan.price,
        currency: plan.currency || "BRL",
        maxSimulations: plan.maxSimulations || -1,
        features: plan.features || [],
        isActive: plan.isActive ?? true
      })
      .returning();
    return newPlan;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async updatePaymentStatus(id: number, status: string, metadata?: any): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ 
        status: status as any,
        metadata,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  // Plan verification
  async checkUserPlanAccess(userId: number): Promise<{ hasAccess: boolean; plan: string; remainingSimulations?: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { hasAccess: false, plan: "none" };
    }

    // Check if user has active premium plan
    if (user.plan === "premium" && user.planExpiresAt && user.planExpiresAt > new Date()) {
      return { hasAccess: true, plan: "premium" };
    }

    // For demo/free users, check simulation count
    if (user.plan === "gratuito") {
      const userSimulations = await this.getSimulationsByUser(userId);
      const remainingSimulations = Math.max(0, (user.maxSimulations || 5) - userSimulations.length);
      
      return { 
        hasAccess: remainingSimulations > 0, 
        plan: "gratuito",
        remainingSimulations 
      };
    }

    return { hasAccess: false, plan: user.plan };
  }

  async upgradeUserPlan(userId: number, plan: string, expiresAt?: Date): Promise<User | undefined> {
    return await this.updateUser(userId, {
      plan: plan as any,
      planExpiresAt: expiresAt,
      maxSimulations: plan === "premium" ? -1 : 5
    });
  }

  // Simulation operations
  async getSimulation(id: number): Promise<Simulation | undefined> {
    const [simulation] = await db.select().from(simulations).where(eq(simulations.id, id));
    return simulation || undefined;
  }

  async getSimulationsByUser(userId: number): Promise<Simulation[]> {
    return await db.select().from(simulations)
      .where(eq(simulations.userId, userId))
      .orderBy(desc(simulations.createdAt));
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [newSimulation] = await db
      .insert(simulations)
      .values(simulation)
      .returning();
    return newSimulation;
  }

  async updateSimulation(id: number, simulation: Partial<InsertSimulation>): Promise<Simulation | undefined> {
    const [updated] = await db
      .update(simulations)
      .set({ ...simulation, updatedAt: new Date() })
      .where(eq(simulations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSimulation(id: number): Promise<boolean> {
    await db.delete(simulations).where(eq(simulations.id, id));
    return true;
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db
      .insert(organizations)
      .values(organization)
      .returning();
    return newOrg;
  }

  // Stats operations
  async getUserStats(userId: number): Promise<{
    totalSimulations: number;
    activeProjects: number;
    totalSavings: number;
    totalPower: number;
  }> {
    const userSimulations = await this.getSimulationsByUser(userId);
    
    const totalSimulations = userSimulations.length;
    const activeProjects = userSimulations.filter(s => s.status === 'calculated' || s.status === 'approved').length;
    
    let totalSavings = 0;
    let totalPower = 0;

    for (const sim of userSimulations) {
      if (sim.results && typeof sim.results === 'object') {
        const results = sim.results as any;
        totalSavings += results.annualSavings || 0;
        totalPower += results.systemPower || 0;
      }
    }

    return {
      totalSimulations,
      activeProjects,
      totalSavings,
      totalPower
    };
  }

  // Calculate simulation with improved algorithm
  async calculateSimulationResults(simulation: Simulation): Promise<any> {
    const params = simulation.parameters as any;
    
    switch (simulation.type) {
      case 'residential':
        return this.calculateResidential(params);
      case 'commercial':
        return this.calculateCommercial(params);
      case 'ev_charging':
        return this.calculateEvCharging(params);
      case 'common_areas':
        return this.calculateCommonAreas(params);
      case 'multi_unit':
        return this.calculateMultiUnit(params);
      default:
        throw new Error(`Tipo de simulação não suportado: ${simulation.type}`);
    }
  }

  private calculateResidential(params: any): any {
    const monthlyConsumption = params.monthlyConsumption || 0;
    const availableArea = params.availableArea || 0;
    const state = params.state || 'GO';

    const irradiation = getSolarIrradiation(state);
    const regionalFactor = getRegionalFactor(state);
    
    const requiredPower = calculateRequiredPower(monthlyConsumption, irradiation);
    const panelCount = calculatePanelCount(requiredPower);
    
    const systemPower = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power;
    const usedArea = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area;
    const monthlyGeneration = (systemPower / 1000) * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
    
    // Financial calculations
    const investmentPerWp = SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_per_wp * regionalFactor.cost;
    const totalInvestment = systemPower * investmentPerWp;
    
    const currentTariff = SOLAR_SIMULATION_CONFIG.FINANCIAL.tariff_kwh;
    const annualSavings = monthlyGeneration * 12 * currentTariff * 0.95; // 95% considering compensation
    const paybackYears = totalInvestment / annualSavings;
    
    const scenarios = getInvestmentScenarios(totalInvestment);

    return {
      systemPower,
      panelCount,
      usedArea,
      monthlyGeneration,
      annualGeneration: monthlyGeneration * 12,
      totalInvestment,
      annualSavings,
      paybackYears,
      roi: (annualSavings / totalInvestment) * 100,
      co2Reduction: monthlyGeneration * 12 * 0.084, // kg CO2/year
      scenarios,
      coveragePercentage: Math.min(100, (monthlyGeneration / monthlyConsumption) * 100),
      irradiation,
      regionalFactor
    };
  }

  private calculateCommercial(params: any): any {
    // Similar to residential but with commercial factors
    return this.calculateResidential(params);
  }

  private calculateEvCharging(params: any): any {
    const monthlyKm = params.monthlyKm || 0;
    const vehicleEfficiency = params.vehicleEfficiency || 6; // km/kWh
    const chargingHours = params.chargingHours || 8;

    const monthlyConsumption = monthlyKm / vehicleEfficiency;
    
    return this.calculateResidential({ 
      ...params, 
      monthlyConsumption 
    });
  }

  private calculateCommonAreas(params: any): any {
    const elevatorPower = (params.elevators || 0) * 4; // 4kW per elevator
    const poolPower = (params.pools || 0) * 2; // 2kW per pool
    const lightingPower = (params.lightingLoad || 0);
    const securityPower = (params.securityLoad || 0);

    const totalLoad = elevatorPower + poolPower + lightingPower + securityPower;
    const dailyHours = params.dailyHours || 12;
    const monthlyConsumption = totalLoad * dailyHours * 30 / 1000; // kWh

    return this.calculateResidential({ 
      ...params, 
      monthlyConsumption 
    });
  }

  private calculateMultiUnit(params: any): any {
    const unitCount = params.totalUnits || 1;
    const unitConsumption = params.unitConsumption || 300;
    const totalResidential = unitCount * unitConsumption;

    let commonAreaConsumption = 0;
    if (params.hasCommonAreas) {
      const commonCalc = this.calculateCommonAreas(params.commonAreasParams || {});
      commonAreaConsumption = commonCalc.monthlyGeneration || 0;
    }

    let evChargingConsumption = 0;
    if (params.hasEvCharging) {
      const evCalc = this.calculateEvCharging(params.evChargingParams || {});
      evChargingConsumption = evCalc.monthlyGeneration || 0;
    }

    const totalConsumption = totalResidential + commonAreaConsumption + evChargingConsumption;

    const results = this.calculateResidential({
      ...params,
      monthlyConsumption: totalConsumption
    });

    return {
      ...results,
      unitDetails: {
        unitCount,
        unitConsumption,
        totalResidential,
        commonAreaConsumption,
        evChargingConsumption,
        totalConsumption
      }
    };
  }
}

export const storage = new DatabaseStorage();