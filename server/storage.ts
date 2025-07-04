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

// Fix iteration issue
declare global {
  interface SymbolConstructor {
    readonly iterator: symbol;
  }
}
import { 
  SOLAR_SIMULATION_CONFIG, 
  getSolarIrradiation, 
  getRegionalFactor, 
  calculateRequiredPower, 
  calculatePanelCount,
  getInvestmentScenarios
} from '@shared/simulation-config';
import { eq, and, desc, count, gte } from "drizzle-orm";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private simulations: Map<number, Simulation>;
  private organizations: Map<number, Organization>;
  private plans: Map<number, Plan>;
  private payments: Map<number, Payment>;
  private sessions: Map<string, Session>;
  private resetTokens: Map<string, { userId: number; expiresAt: Date }>;
  private currentUserId: number;
  private currentSimulationId: number;
  private currentOrgId: number;
  private currentPlanId: number;
  private currentPaymentId: number;

  constructor() {
    this.users = new Map();
    this.simulations = new Map();
    this.organizations = new Map();
    this.plans = new Map();
    this.payments = new Map();
    this.sessions = new Map();
    this.resetTokens = new Map();
    this.currentUserId = 1;
    this.currentSimulationId = 1;
    this.currentOrgId = 1;
    this.currentPlanId = 1;
    this.currentPaymentId = 1;
    
    this.initializeDefaultPlans();
  }

  private async initializeDefaultPlans() {
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
      maxSimulations: -1, // Unlimited
      features: [
        "Todos os módulos liberados",
        "Simulações ilimitadas",
        "Relatórios completos",
        "Suporte prioritário"
      ],
      isActive: true,
    });
  }



  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt: now,
      updatedAt: now,
      lastLogin: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  // Authentication methods
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Password reset methods
  async createResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    this.resetTokens.set(token, { userId: user.id, expiresAt });
    
    // Update user with reset token
    await this.updateUser(user.id, {
      resetToken: token,
      resetTokenExpiresAt: expiresAt,
    });

    return token;
  }

  async verifyResetToken(token: string): Promise<User | null> {
    const resetData = this.resetTokens.get(token);
    if (!resetData || resetData.expiresAt < new Date()) {
      this.resetTokens.delete(token);
      return null;
    }

    const user = await this.getUser(resetData.userId);
    return user || null;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<boolean> {
    const user = await this.updateUser(userId, { hashedPassword });
    if (user) {
      await this.clearResetToken(userId);
      return true;
    }
    return false;
  }

  async clearResetToken(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user && user.resetToken) {
      this.resetTokens.delete(user.resetToken);
      await this.updateUser(userId, {
        resetToken: null,
        resetTokenExpiresAt: null,
      });
    }
  }

  // Session management
  async createSession(userId: number): Promise<Session> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session: Session = {
      id: sessionId,
      userId,
      expiresAt,
      createdAt: new Date(),
    };
    
    this.sessions.set(sessionId, session);
    await this.updateUserLastLogin(userId);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(sessionId);
    }
    return undefined;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Plan operations
  async getPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values()).filter(plan => plan.isActive);
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    return this.plans.get(id);
  }

  async createPlan(insertPlan: InsertPlan): Promise<Plan> {
    const id = this.currentPlanId++;
    const now = new Date();
    const plan: Plan = {
      ...insertPlan,
      id,
      createdAt: now,
    };
    this.plans.set(id, plan);
    return plan;
  }

  // Payment operations
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const now = new Date();
    const payment: Payment = {
      ...insertPayment,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.userId === userId);
  }

  async updatePaymentStatus(id: number, status: string, metadata?: any): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment: Payment = {
      ...payment,
      status: status as any,
      metadata: metadata || payment.metadata,
      updatedAt: new Date(),
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Plan verification and access control
  async checkUserPlanAccess(userId: number): Promise<{ hasAccess: boolean; plan: string; remainingSimulations?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { hasAccess: false, plan: "gratuito" };

    const now = new Date();
    let userPlan = user.plan || "gratuito";

    // Check if premium plan is expired
    if (userPlan === "premium" && user.planExpiresAt && user.planExpiresAt < now) {
      // Downgrade to free plan
      await this.upgradeUserPlan(userId, "gratuito");
      userPlan = "gratuito";
    }

    if (userPlan === "premium") {
      return { hasAccess: true, plan: "premium" };
    }

    // For free plan, check simulation count
    const userSimulations = await this.getSimulationsByUser(userId);
    const maxSimulations = user.maxSimulations || 5;
    const remainingSimulations = Math.max(0, maxSimulations - userSimulations.length);

    return {
      hasAccess: remainingSimulations > 0,
      plan: "gratuito",
      remainingSimulations
    };
  }

  async upgradeUserPlan(userId: number, plan: string, expiresAt?: Date): Promise<User | undefined> {
    const maxSimulations = plan === "premium" ? -1 : 5;
    return this.updateUser(userId, {
      plan: plan as any,
      planExpiresAt: expiresAt || null,
      maxSimulations,
    });
  }

  async getSimulation(id: number): Promise<Simulation | undefined> {
    return this.simulations.get(id);
  }

  async getSimulationsByUser(userId: number): Promise<Simulation[]> {
    return Array.from(this.simulations.values()).filter(sim => sim.userId === userId);
  }

  async createSimulation(insertSimulation: InsertSimulation): Promise<Simulation> {
    const id = this.currentSimulationId++;
    const now = new Date();
    const simulation: Simulation = {
      ...insertSimulation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.simulations.set(id, simulation);
    return simulation;
  }

  async updateSimulation(id: number, simulationData: Partial<InsertSimulation>): Promise<Simulation | undefined> {
    const simulation = this.simulations.get(id);
    if (!simulation) return undefined;
    
    const updatedSimulation: Simulation = {
      ...simulation,
      ...simulationData,
      updatedAt: new Date(),
    };
    this.simulations.set(id, updatedSimulation);
    return updatedSimulation;
  }

  async deleteSimulation(id: number): Promise<boolean> {
    return this.simulations.delete(id);
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const id = this.currentOrgId++;
    const now = new Date();
    const organization: Organization = {
      ...insertOrganization,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async getUserStats(userId: number): Promise<{
    totalSimulations: number;
    activeProjects: number;
    totalSavings: number;
    totalPower: number;
  }> {
    const userSimulations = await this.getSimulationsByUser(userId);
    
    const totalSimulations = userSimulations.length;
    const activeProjects = userSimulations.filter(s => s.status === 'draft' || s.status === 'calculated').length;
    
    let totalSavings = 0;
    let totalPower = 0;
    
    userSimulations.forEach(sim => {
      if (sim.results) {
        const results = sim.results as any;
        totalSavings += results.annual_savings || 0;
        totalPower += results.total_power || 0;
      }
    });
    
    return {
      totalSimulations,
      activeProjects,
      totalSavings,
      totalPower,
    };
  }

  async calculateSimulationResults(simulation: Simulation): Promise<any> {
    const parameters = simulation.parameters as any;
    const state = simulation.state || 'GO';
    
    // Obter multiplicadores para multi-unidades
    const totalUnits = simulation.totalUnits || 1;
    const hasCommonAreas = simulation.hasCommonAreas || false;
    const hasEvCharging = simulation.hasEvCharging || false;
    
    try {
      let baseResults;
      
      switch (simulation.type) {
        case 'residential':
          baseResults = this.calculateResidential(parameters, state);
          break;
        case 'commercial':
          baseResults = this.calculateCommercial(parameters, state);
          break;
        case 'ev_charging':
          baseResults = this.calculateEVCharging(parameters, state);
          break;
        case 'common_areas':
          baseResults = this.calculateCommonAreas(parameters, state);
          break;
        default:
          throw new Error(`Tipo de simulação não suportado: ${simulation.type}`);
      }

      // Aplicar multiplicação por unidades (conforme solicitado)
      if (totalUnits > 1) {
        console.log(`\n=== MULTIPLICAÇÃO POR ${totalUnits} UNIDADES ===`);
        console.log('Valores unitários:', baseResults);
        
        // Extrair valores das estruturas aninhadas
        const unitInvestment = baseResults.financial_analysis?.total_investment || baseResults.total_investment || 0;
        const unitMonthlySavings = baseResults.financial_analysis?.monthly_savings || baseResults.monthly_savings || 0;
        const unitAnnualSavings = baseResults.financial_analysis?.annual_savings || baseResults.annual_savings || 0;
        const unitSystemPower = baseResults.technical_specs?.installed_power || baseResults.system_power || 0;
        const unitPanelCount = baseResults.technical_specs?.panel_count || baseResults.num_panels || 0;
        const unitMonthlyGeneration = baseResults.technical_specs?.monthly_generation || baseResults.monthly_generation || 0;
        const unitAnnualGeneration = baseResults.technical_specs?.annual_generation || baseResults.annual_generation || 0;
        const unitRequiredArea = baseResults.technical_specs?.used_area || baseResults.required_area || 0;
        
        // Aplicar multiplicação nos valores corretos
        baseResults = {
          ...baseResults,
          // Multiplicar valores financeiros e técnicos principais
          total_investment: unitInvestment * totalUnits,
          monthly_savings: unitMonthlySavings * totalUnits,
          annual_savings: unitAnnualSavings * totalUnits,
          system_power: unitSystemPower * totalUnits,
          num_panels: unitPanelCount * totalUnits,
          monthly_consumption: (baseResults.monthly_consumption || 350) * totalUnits,
          monthly_generation: unitMonthlyGeneration * totalUnits,
          annual_generation: unitAnnualGeneration * totalUnits,
          required_area: unitRequiredArea * totalUnits,
          
          // Manter valores relativos inalterados
          payback_years: baseResults.financial_analysis?.payback_years || baseResults.payback_years,
          roi_percentage: baseResults.financial_analysis?.roi_25_years || baseResults.roi_percentage,
          coverage_percentage: baseResults.technical_specs?.coverage_percentage || baseResults.coverage_percentage,
          
          // Adicionar valores técnicos importantes
          irradiation: baseResults.technical_specs?.irradiation || 5.8,
          system_efficiency: baseResults.technical_specs?.system_efficiency || 0.78,
          
          // Adicionar informações do projeto
          project_info: {
            total_units: totalUnits,
            unit_investment: unitInvestment,
            unit_savings: unitMonthlySavings,
            has_common_areas: hasCommonAreas,
            has_ev_charging: hasEvCharging
          }
        };
        
        console.log('Valores finais multiplicados:', baseResults);
      }

      return baseResults;
    } catch (error) {
      console.error('Erro no cálculo da simulação:', error);
      throw error;
    }
  }

  private calculateResidential(parameters: any, state: string): any {
    const monthlyConsumption = parameters.monthlyConsumption || 350;
    const availableArea = parameters.roofArea || 50;
    
    const irradiation = getSolarIrradiation(state);
    const requiredPower = calculateRequiredPower(monthlyConsumption, state);
    const panelCount = calculatePanelCount(requiredPower);
    const requiredArea = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area;
    
    // Log detalhado para análise de métricas
    console.log('=== ANÁLISE DE CÁLCULO RESIDENCIAL ===');
    console.log('Estado:', state);
    console.log('Consumo mensal:', monthlyConsumption, 'kWh');
    console.log('Área disponível:', availableArea, 'm²');
    console.log('Irradiação solar:', irradiation, 'kWh/m²/dia');
    console.log('Potência necessária calculada:', requiredPower.toFixed(2), 'kWp');
    console.log('Número de painéis:', panelCount);
    console.log('Área necessária:', requiredArea.toFixed(2), 'm²');
    console.log('Eficiência do sistema:', SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall);
    
    if (requiredArea > availableArea) {
      const maxPanels = Math.floor(availableArea / SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area);
      const maxPower = maxPanels * (SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power / 1000);
      const maxGeneration = maxPower * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
      
      return this.calculateFinancials({
        installedPower: maxPower,
        panelCount: maxPanels,
        monthlyGeneration: maxGeneration,
        monthlyConsumption,
        usedArea: maxPanels * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area,
        coveragePercentage: (maxGeneration / monthlyConsumption) * 100,
        state
      });
    }
    
    // CORREÇÃO: Usar a fórmula correta para geração
    const monthlyGeneration = requiredPower * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
    
    console.log('=== ANÁLISE FINAL CORRIGIDA ===');
    console.log('Potência necessária:', requiredPower.toFixed(2), 'kWp');
    console.log('Número de painéis:', panelCount);
    console.log('Geração mensal:', monthlyGeneration.toFixed(0), 'kWh');
    console.log('Cobertura do consumo:', ((monthlyGeneration / monthlyConsumption) * 100).toFixed(1), '%');
    console.log('==============================');
    
    return this.calculateFinancials({
      installedPower: requiredPower,
      panelCount,
      monthlyGeneration,
      monthlyConsumption,
      usedArea: requiredArea,
      coveragePercentage: 100,
      state
    });
  }

  private calculateCommercial(parameters: any, state: string): any {
    const monthlyConsumption = parameters.monthlyConsumption || 2500;
    const availableArea = parameters.availableArea || 200;
    const operatingHours = parameters.operatingHours || 12;
    
    // Ajuste para consumo comercial (maior durante o dia)
    const daytimeConsumption = monthlyConsumption * 0.7; // 70% do consumo durante o dia
    const irradiation = getSolarIrradiation(state);
    const requiredPower = calculateRequiredPower(daytimeConsumption, state);
    const panelCount = calculatePanelCount(requiredPower);
    const requiredArea = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area;
    
    if (requiredArea > availableArea) {
      const maxPanels = Math.floor(availableArea / SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area);
      const maxPower = maxPanels * (SOLAR_SIMULATION_CONFIG.PANEL_SPECS.power / 1000);
      const maxGeneration = maxPower * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
      
      return this.calculateFinancials({
        installedPower: maxPower,
        panelCount: maxPanels,
        monthlyGeneration: maxGeneration,
        monthlyConsumption,
        usedArea: maxPanels * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area,
        coveragePercentage: (maxGeneration / monthlyConsumption) * 100,
        state,
        projectType: 'commercial'
      });
    }
    
    const monthlyGeneration = requiredPower * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
    
    return this.calculateFinancials({
      installedPower: requiredPower,
      panelCount,
      monthlyGeneration,
      monthlyConsumption,
      usedArea: requiredArea,
      coveragePercentage: 100,
      state,
      projectType: 'commercial'
    });
  }

  private calculateEVCharging(parameters: any, state: string): any {
    const vehicleCount = parameters.vehicleCount || 1;
    const monthlyKm = parameters.monthlyKm || 1200;
    const vehicleEfficiency = parameters.vehicleEfficiency || 6; // km/kWh
    
    const monthlyConsumption = (monthlyKm / vehicleEfficiency) * vehicleCount;
    const irradiation = getSolarIrradiation(state);
    const requiredPower = calculateRequiredPower(monthlyConsumption, state);
    const panelCount = calculatePanelCount(requiredPower);
    const requiredArea = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area;
    
    const monthlyGeneration = requiredPower * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
    
    return this.calculateFinancials({
      installedPower: requiredPower,
      panelCount,
      monthlyGeneration,
      monthlyConsumption,
      usedArea: requiredArea,
      coveragePercentage: 100,
      state,
      projectType: 'ev_charging',
      vehicleCount,
      monthlyKm
    });
  }

  private calculateCommonAreas(parameters: any, state: string): any {
    const buildingUnits = parameters.buildingUnits || 20;
    const hasElevator = parameters.hasElevator || false;
    const hasPool = parameters.hasPool || false;
    const hasSecurity = parameters.hasSecurity || true;
    
    let monthlyConsumption = buildingUnits * 50; // 50 kWh base por unidade
    
    if (hasElevator) monthlyConsumption += SOLAR_SIMULATION_CONFIG.PROJECT_TYPES.common_areas.elevator_consumption;
    if (hasPool) monthlyConsumption += SOLAR_SIMULATION_CONFIG.PROJECT_TYPES.common_areas.pool_consumption;
    if (hasSecurity) monthlyConsumption += SOLAR_SIMULATION_CONFIG.PROJECT_TYPES.common_areas.security_consumption;
    
    const irradiation = getSolarIrradiation(state);
    const requiredPower = calculateRequiredPower(monthlyConsumption, state);
    const panelCount = calculatePanelCount(requiredPower);
    const requiredArea = panelCount * SOLAR_SIMULATION_CONFIG.PANEL_SPECS.area;
    
    const monthlyGeneration = requiredPower * irradiation * 30 * SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall;
    
    return this.calculateFinancials({
      installedPower: requiredPower,
      panelCount,
      monthlyGeneration,
      monthlyConsumption,
      usedArea: requiredArea,
      coveragePercentage: 100,
      state,
      projectType: 'common_areas',
      buildingUnits
    });
  }

  private calculateFinancials(data: any): any {
    const { installedPower, panelCount, monthlyGeneration, monthlyConsumption, usedArea, coveragePercentage, state, projectType } = data;
    
    const regionalFactor = getRegionalFactor(state);
    
    // Cenários modulares de investimento para flexibilidade do cliente
    const investmentScenarios = getInvestmentScenarios(installedPower);
    const totalInvestment = investmentScenarios['Completo (com instalação)'].totalCost * regionalFactor.cost;
    
    // Log dos cálculos financeiros
    console.log('=== ANÁLISE FINANCEIRA ===');
    console.log('Potência instalada:', installedPower.toFixed(2), 'kWp');
    console.log('Geração mensal:', monthlyGeneration.toFixed(0), 'kWh');
    console.log('Fator regional de custo:', regionalFactor.cost);
    console.log('Custo por Wp:', SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_per_wp, 'R$');
    console.log('Investimento total:', totalInvestment.toFixed(0), 'R$');
    
    const monthlySavings = monthlyGeneration * SOLAR_SIMULATION_CONFIG.FINANCIAL.tariff_kwh;
    const annualSavings = monthlySavings * 12;
    
    console.log('Tarifa kWh:', SOLAR_SIMULATION_CONFIG.FINANCIAL.tariff_kwh, 'R$');
    console.log('Economia mensal:', monthlySavings.toFixed(0), 'R$');
    console.log('Economia anual:', annualSavings.toFixed(0), 'R$');
    
    // Cálculo do payback considerando aumento anual da tarifa
    let cumulativeSavings = 0;
    let paybackYears = 0;
    
    for (let year = 1; year <= 25; year++) {
      const yearlyTariff = SOLAR_SIMULATION_CONFIG.FINANCIAL.tariff_kwh * Math.pow(1 + SOLAR_SIMULATION_CONFIG.FINANCIAL.annual_increase, year - 1);
      const yearlySavings = monthlyGeneration * 12 * yearlyTariff;
      cumulativeSavings += yearlySavings;
      
      if (cumulativeSavings >= totalInvestment && paybackYears === 0) {
        paybackYears = year + (totalInvestment - (cumulativeSavings - yearlySavings)) / yearlySavings;
      }
    }
    
    const roi = ((cumulativeSavings - totalInvestment) / totalInvestment) * 100;
    
    return {
      technical_specs: {
        installed_power: Math.round(installedPower * 100) / 100,
        panel_count: panelCount,
        monthly_generation: Math.round(monthlyGeneration),
        annual_generation: Math.round(monthlyGeneration * 12),
        used_area: Math.round(usedArea * 100) / 100,
        coverage_percentage: Math.round(coveragePercentage),
        irradiation: getSolarIrradiation(state),
        system_efficiency: SOLAR_SIMULATION_CONFIG.SYSTEM_EFFICIENCY.overall
      },
      financial_analysis: {
        total_investment: Math.round(totalInvestment),
        monthly_savings: Math.round(monthlySavings),
        annual_savings: Math.round(annualSavings),
        payback_years: Math.round(paybackYears * 100) / 100,
        roi_25_years: Math.round(roi),
        total_savings_25_years: Math.round(cumulativeSavings),
        net_profit_25_years: Math.round(cumulativeSavings - totalInvestment),
        investment_scenarios: Object.fromEntries(
          Object.entries(investmentScenarios).map(([name, scenario]) => [
            name,
            {
              total_cost: Math.round(scenario.totalCost * regionalFactor.cost),
              payback_years: Math.round((scenario.totalCost * regionalFactor.cost / annualSavings) * 100) / 100,
              cost_breakdown: scenario.costBreakdown
            }
          ])
        )
      },
      environmental_impact: {
        co2_avoided_annually: Math.round(monthlyGeneration * 12 * 0.0817), // kg CO2/kWh
        trees_equivalent: Math.round(monthlyGeneration * 12 * 0.0817 / 21.77) // árvores equivalentes
      }
    };
  }
}

export const storage = new MemStorage();
