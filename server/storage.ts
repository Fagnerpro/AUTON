import { 
  users, 
  simulations, 
  organizations, 
  plans,
  payments,
  sessions,
  demoSimulations,
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
  type InsertSession,
  type DemoSimulation,
  type InsertDemoSimulation
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
  
  // Demo simulation control
  checkDemoSimulationLimit(ipAddress: string, userAgent?: string): Promise<{ canCreate: boolean; count: number }>;
  recordDemoSimulation(ipAddress: string, userAgent?: string): Promise<void>;
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
    const planData: any = {
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      currency: plan.currency || "BRL",
      maxSimulations: plan.maxSimulations || -1,
      features: plan.features || [],
      isActive: plan.isActive ?? true
    };
    
    const [newPlan] = await db
      .insert(plans)
      .values(planData)
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

    // Contagem de simulações do usuário
    const userSimulations = await this.getSimulationsByUser(userId);
    const simulationCount = userSimulations.length;

    // Lógica de acesso por plano
    switch (user.plan) {
      case "demo":
        return {
          hasAccess: true, // Demo sempre tem acesso para tentar criar
          plan: "demo",
          remainingSimulations: Math.max(0, 1 - simulationCount)
        };
      
      case "gratuito":
        return {
          hasAccess: simulationCount < (user.maxSimulations || 5),
          plan: "gratuito",
          remainingSimulations: Math.max(0, (user.maxSimulations || 5) - simulationCount)
        };
      
      case "premium":
        return {
          hasAccess: true,
          plan: "premium",
          remainingSimulations: -1 // Ilimitado
        };
      
      default:
        return { hasAccess: false, plan: user.plan };
    }
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
    
    const scenarios = getInvestmentScenarios(systemPower / 1000); // Convert Wp to kW

    return {
      systemPower,
      panelCount,
      usedArea,
      monthlyGeneration,
      annualGeneration: monthlyGeneration * 12,
      totalInvestment,
      annualSavings,
      paybackYears: Math.round(paybackYears * 10) / 10, // Arredondado para 1 casa decimal
      roi: Math.round((annualSavings / totalInvestment) * 100 * 10) / 10,
      co2Reduction: monthlyGeneration * 12 * 0.084, // kg CO2/year
      scenarios,
      coveragePercentage: Math.round(Math.min(100, (monthlyGeneration / monthlyConsumption) * 100) * 10) / 10,
      irradiation,
      regionalFactor
    };
  }

  private calculateCommercial(params: any): any {
    const monthlyConsumption = params.monthlyConsumption || 0;
    const availableArea = params.availableArea || 0;
    const state = params.state || 'GO';
    const peakPower = params.peakPower || 0;
    const operatingHours = params.operatingHours || 12;

    const irradiation = getSolarIrradiation(state);
    const regionalFactor = getRegionalFactor(state);
    
    // Commercial systems use different calculation approach
    const requiredPower = calculateRequiredPower(monthlyConsumption, irradiation);
    const panelCount = calculatePanelCount(requiredPower);
    
    const systemPower = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power;
    const usedArea = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area;
    const monthlyGeneration = (systemPower / 1000) * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
    
    // Commercial tariff and factors
    const commercialTariff = 0.75; // Higher commercial tariff R$/kWh
    const commercialFactor = 0.85; // Commercial systems have better utilization
    const installationFactor = 0.9; // Commercial installations are typically more efficient
    
    // Financial calculations for commercial
    const investmentPerWp = SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_per_wp * regionalFactor.cost * installationFactor;
    const totalInvestment = systemPower * investmentPerWp;
    
    const annualSavings = monthlyGeneration * 12 * commercialTariff * commercialFactor;
    const paybackYears = totalInvestment / annualSavings;
    
    const scenarios = getInvestmentScenarios(systemPower / 1000); // Convert Wp to kW

    return {
      systemPower,
      panelCount,
      usedArea,
      monthlyGeneration,
      annualGeneration: monthlyGeneration * 12,
      totalInvestment,
      annualSavings,
      paybackYears: Math.round(paybackYears * 10) / 10,
      roi: Math.round((annualSavings / totalInvestment) * 100 * 10) / 10,
      co2Reduction: monthlyGeneration * 12 * 0.084, // kg CO2/year
      scenarios,
      coveragePercentage: Math.round(Math.min(100, (monthlyGeneration / monthlyConsumption) * 100) * 10) / 10,
      irradiation,
      regionalFactor,
      commercialTariff,
      // Commercial-specific metrics
      demandSavings: peakPower * 15 * 12, // Peak demand savings (R$/kW/month)
      operationalSavings: annualSavings * 0.15, // Additional operational savings
      totalCommercialSavings: annualSavings + (peakPower * 15 * 12)
    };
  }

  private calculateEvCharging(params: any): any {
    const numSpots = parseInt(params.num_parking_spots) || 0;
    const chargingPercentage = parseFloat(params.charging_points_percentage) || 0;
    const energyPerCharge = parseFloat(params.energy_per_charge) || 18;
    const chargesPerDay = parseFloat(params.charges_per_day) || 1;
    const state = params.state || 'GO';
    
    // Cálculos de demanda de energia
    const chargingPoints = Math.floor(numSpots * chargingPercentage / 100);
    const dailyConsumption = chargingPoints * energyPerCharge * chargesPerDay;
    const annualConsumption = dailyConsumption * 365;
    const monthlyConsumption = dailyConsumption * 30;
    
    const irradiation = getSolarIrradiation(state);
    const regionalFactor = getRegionalFactor(state);
    
    // Cálculo de potência do sistema solar usando metodologia padrão
    const requiredPowerKw = calculateRequiredPower(monthlyConsumption, irradiation);
    const panelCount = calculatePanelCount(requiredPowerKw);
    const systemPower = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power;
    
    // Área utilizada
    const usedArea = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area;
    
    // Geração de energia
    const monthlyGeneration = (systemPower / 1000) * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
    const annualGeneration = monthlyGeneration * 12;
    
    // Sistema de armazenamento (baterias para EV charging)
    const batteryCapacity = dailyConsumption * 1.5; // 50% extra para autonomia
    const batteryCostPerKWh = 900; // R$ por kWh de bateria LiFePO4
    const batteryCost = batteryCapacity * batteryCostPerKWh;
    
    // Custo do sistema solar
    const costPerWp = SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_per_wp * regionalFactor.cost;
    const solarSystemCost = systemPower * costPerWp;
    
    // Infraestrutura de carregamento
    const chargingInfrastructureCost = chargingPoints * 8000; // R$ 8.000 por ponto de recarga
    
    // Investimento total
    const totalInvestment = solarSystemCost + batteryCost + chargingInfrastructureCost;
    
    // Modelo de receita EV charging
    const chargingFeePerKWh = 0.45; // R$ 0,45/kWh (preço competitivo)
    const operatingCostPerKWh = 0.05; // R$ 0,05/kWh (manutenção, energia de backup)
    const netRevenuePerKWh = chargingFeePerKWh - operatingCostPerKWh;
    
    // Economia com energia própria vs. rede elétrica
    const gridCostPerKWh = SOLAR_SIMULATION_CONFIG.FINANCIAL.tariff_kwh;
    const energySavings = annualConsumption * gridCostPerKWh * 0.7; // 70% auto-consumo
    
    // Receita total anual
    const chargingRevenue = annualConsumption * netRevenuePerKWh;
    const annualSavings = energySavings + chargingRevenue;
    
    // Payback e ROI
    const rawPaybackYears = totalInvestment / annualSavings;
    const paybackYears = Math.round(rawPaybackYears * 10) / 10; // Arredondado para 1 casa decimal
    const roi25Years = ((annualSavings * 25 - totalInvestment) / totalInvestment) * 100;
    
    // Cenários de investimento específicos para EV
    const scenarios = this.getEvChargingScenarios(systemPower / 1000, chargingPoints);

    return {
      systemPower,
      panelCount,
      usedArea,
      monthlyGeneration,
      annualGeneration,
      totalInvestment,
      annualSavings,
      paybackYears,
      roi: Math.round((annualSavings / totalInvestment) * 100 * 10) / 10,
      co2Reduction: annualGeneration * 0.084, // kg CO2/year evitado
      coveragePercentage: Math.round(Math.min(100, (annualGeneration / annualConsumption) * 100) * 10) / 10,
      irradiation,
      regionalFactor,
      scenarios,
      // EV-specific data
      num_charging_points: chargingPoints,
      num_panels: panelCount,
      total_power: systemPower / 1000, // kW
      daily_consumption: dailyConsumption,
      annual_consumption: annualConsumption,
      battery_capacity: batteryCapacity,
      charging_revenue: chargingFeePerKWh,
      roi_percentage: Math.round(roi25Years * 10) / 10, // Arredondado para 1 casa decimal
      // Dados financeiros detalhados
      solar_system_cost: solarSystemCost,
      battery_cost: batteryCost,
      infrastructure_cost: chargingInfrastructureCost,
      energy_savings: energySavings,
      charging_net_revenue: chargingRevenue
    };
  }

  // Método para cenários específicos de EV charging
  private getEvChargingScenarios(systemPowerKw: number, chargingPoints: number) {
    const systemPowerWp = systemPowerKw * 1000;
    const costPerWp = SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_per_wp;
    
    // Cenário básico - Solar apenas
    const solarBasicCost = systemPowerWp * costPerWp;
    const basicPayback = 8.5;
    
    // Cenário híbrido - Solar + Baterias
    const hybridCost = solarBasicCost + (chargingPoints * 15000);
    const hybridPayback = 10.2;
    
    // Cenário completo - EV Ready
    const completeCost = solarBasicCost + (chargingPoints * 25000);
    const completePayback = 12.8;

    return {
      'Solar Básico': {
        description: 'Sistema solar conectado à rede, sem baterias.',
        features: ['Painéis solares', 'Inversores grid-tie', 'Instalação completa'],
        payback_years: basicPayback,
        total_cost: solarBasicCost,
        costBreakdown: [
          `Painéis: R$ ${(solarBasicCost * 0.6).toLocaleString('pt-BR')}`,
          `Inversores: R$ ${(solarBasicCost * 0.25).toLocaleString('pt-BR')}`,
          `Instalação: R$ ${(solarBasicCost * 0.15).toLocaleString('pt-BR')}`,
          `Total: R$ ${solarBasicCost.toLocaleString('pt-BR')}`
        ]
      },
      'Solar + Baterias': {
        description: 'Sistema híbrido com armazenamento para autonomia.',
        features: ['Painéis solares', 'Inversores híbridos', 'Baterias LiFePO4', 'Instalação especializada'],
        payback_years: hybridPayback,
        total_cost: hybridCost,
        costBreakdown: [
          `Sistema Solar: R$ ${solarBasicCost.toLocaleString('pt-BR')}`,
          `Baterias: R$ ${(chargingPoints * 15000).toLocaleString('pt-BR')}`,
          `Total: R$ ${hybridCost.toLocaleString('pt-BR')}`
        ]
      },
      'Completo EV Ready': {
        description: 'Sistema completo otimizado para recarga de veículos.',
        features: ['Painéis high-end', 'Inversores premium', 'Baterias de alta capacidade', 'Infraestrutura EV', 'Monitoramento'],
        payback_years: completePayback,
        total_cost: completeCost,
        costBreakdown: [
          `Sistema Solar: R$ ${solarBasicCost.toLocaleString('pt-BR')}`,
          `Infraestrutura EV: R$ ${(chargingPoints * 25000).toLocaleString('pt-BR')}`,
          `Total: R$ ${completeCost.toLocaleString('pt-BR')}`
        ]
      }
    };
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

  // Demo simulation control methods
  async checkDemoSimulationLimit(ipAddress: string, userAgent?: string): Promise<{ canCreate: boolean; count: number }> {
    // Busca registro existente para este IP nas últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [existingRecord] = await db
      .select()
      .from(demoSimulations)
      .where(
        and(
          eq(demoSimulations.ipAddress, ipAddress),
          gte(demoSimulations.lastSimulationAt, twentyFourHoursAgo)
        )
      )
      .limit(1);
    
    const currentCount = existingRecord?.simulationCount || 0;
    const canCreate = currentCount < 1; // Máximo 1 simulação demo por IP em 24h
    
    return { canCreate, count: currentCount };
  }
  
  async recordDemoSimulation(ipAddress: string, userAgent?: string): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Verifica se já existe um registro para este IP nas últimas 24 horas
    const [existingRecord] = await db
      .select()
      .from(demoSimulations)
      .where(
        and(
          eq(demoSimulations.ipAddress, ipAddress),
          gte(demoSimulations.lastSimulationAt, twentyFourHoursAgo)
        )
      )
      .limit(1);
    
    if (existingRecord) {
      // Atualiza o registro existente
      await db
        .update(demoSimulations)
        .set({
          simulationCount: (existingRecord.simulationCount || 0) + 1,
          lastSimulationAt: new Date(),
          userAgent: userAgent || existingRecord.userAgent
        })
        .where(eq(demoSimulations.id, existingRecord.id));
    } else {
      // Cria novo registro
      await db
        .insert(demoSimulations)
        .values({
          ipAddress,
          userAgent,
          simulationCount: 1,
          lastSimulationAt: new Date()
        });
    }
  }
}

export const storage = new DatabaseStorage();