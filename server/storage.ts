import { users, simulations, organizations, type User, type InsertUser, type Simulation, type InsertSimulation, type Organization, type InsertOrganization } from "@shared/schema";
import { 
  SOLAR_SIMULATION_CONFIG, 
  getSolarIrradiation, 
  getRegionalFactor, 
  calculateRequiredPower, 
  calculatePanelCount 
} from '@shared/simulation-config';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;
  
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
  private currentUserId: number;
  private currentSimulationId: number;
  private currentOrgId: number;

  constructor() {
    this.users = new Map();
    this.simulations = new Map();
    this.organizations = new Map();
    this.currentUserId = 1;
    this.currentSimulationId = 1;
    this.currentOrgId = 1;
    
    // Create demo user
    this.createUser({
      email: "demo@auton.com",
      hashedPassword: "$2b$10$demo.hashed.password", // In real app, hash properly
      name: "Usuário Demo",
      company: "USINA I.A.",
      phone: "(62) 99999-9999",
      role: "admin",
      isActive: true,
      isVerified: true,
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
    
    try {
      switch (simulation.type) {
        case 'residential':
          return this.calculateResidential(parameters, state);
        case 'commercial':
          return this.calculateCommercial(parameters, state);
        case 'ev_charging':
          return this.calculateEVCharging(parameters, state);
        case 'common_areas':
          return this.calculateCommonAreas(parameters, state);
        default:
          throw new Error(`Tipo de simulação não suportado: ${simulation.type}`);
      }
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
    
    console.log('Geração mensal calculada:', monthlyGeneration.toFixed(0), 'kWh');
    console.log('Cobertura do consumo:', ((monthlyGeneration / monthlyConsumption) * 100).toFixed(1), '%');
    console.log('=====================================');
    
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
    const totalInvestment = installedPower * 1000 * SOLAR_SIMULATION_CONFIG.FINANCIAL.installation_cost_per_wp * regionalFactor.cost;
    
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
        net_profit_25_years: Math.round(cumulativeSavings - totalInvestment)
      },
      environmental_impact: {
        co2_avoided_annually: Math.round(monthlyGeneration * 12 * 0.0817), // kg CO2/kWh
        trees_equivalent: Math.round(monthlyGeneration * 12 * 0.0817 / 21.77) // árvores equivalentes
      }
    };
  }
}

export const storage = new MemStorage();
