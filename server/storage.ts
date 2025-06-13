import { users, simulations, organizations, type User, type InsertUser, type Simulation, type InsertSimulation, type Organization, type InsertOrganization } from "@shared/schema";

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
}

export const storage = new MemStorage();
