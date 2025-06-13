import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertSimulationSchema, type User } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "auton-solar-secret-key";

interface AuthRequest extends Express.Request {
  user?: User;
}

// Middleware to verify JWT token
function authenticateToken(req: AuthRequest, res: Express.Response, next: Express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  });
}

// Solar calculation functions
function calculateResidentialSystem(params: any) {
  const numUnits = parseInt(params.num_units) || 0;
  const consumptionPerUnit = parseFloat(params.consumption_per_unit) || 0;
  const availableArea = parseFloat(params.available_area) || 0;
  
  const totalConsumption = numUnits * consumptionPerUnit * 12; // Annual consumption
  const panelPower = 550; // Watts per panel
  const systemEfficiency = 0.85;
  const sunHours = 5.5; // Daily sun hours
  
  const requiredPower = (totalConsumption / (sunHours * 365 * systemEfficiency)) * 1000;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000; // kWp
  const requiredArea = numPanels * 2.1; // m² per panel
  const annualGeneration = actualPower * sunHours * 365 * systemEfficiency;
  
  const costPerWatt = 4.5; // R$ per Wp
  const totalInvestment = actualPower * 1000 * costPerWatt;
  const energyTariff = 0.65; // R$ per kWh
  const annualSavings = annualGeneration * energyTariff;
  const paybackYears = totalInvestment / annualSavings;
  const roi25Years = ((annualSavings * 25) / totalInvestment) * 100;
  
  return {
    num_panels: numPanels,
    total_power: actualPower,
    required_area: requiredArea,
    annual_generation: annualGeneration,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: roi25Years,
    area_sufficient: availableArea >= requiredArea,
    area_status: availableArea >= requiredArea ? 
      'Área suficiente para instalação completa' : 
      `Área insuficiente. Necessário ${requiredArea.toFixed(0)}m², disponível ${availableArea}m²`
  };
}

function calculateEVChargingSystem(params: any) {
  const numSpots = parseInt(params.num_parking_spots) || 0;
  const chargingPercentage = parseFloat(params.charging_points_percentage) || 0;
  const energyPerCharge = parseFloat(params.energy_per_charge) || 18;
  const chargesPerDay = parseFloat(params.charges_per_day) || 1;
  
  const chargingPoints = Math.floor(numSpots * chargingPercentage / 100);
  const dailyConsumption = chargingPoints * energyPerCharge * chargesPerDay;
  const annualConsumption = dailyConsumption * 365;
  
  const sunHours = 5.5;
  const systemEfficiency = 0.85;
  const requiredPower = (dailyConsumption / (sunHours * systemEfficiency)) * 1000;
  const panelPower = 550;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000;
  
  const batteryCapacity = dailyConsumption * 1.2; // 20% extra capacity
  const costPerWatt = 4.5;
  const batteryCostPerKWh = 800;
  const totalInvestment = (actualPower * 1000 * costPerWatt) + (batteryCapacity * batteryCostPerKWh);
  
  const chargingRevenue = 0.15; // R$ per kWh charging fee
  const annualSavings = annualConsumption * chargingRevenue;
  const paybackYears = totalInvestment / annualSavings;
  
  return {
    num_charging_points: chargingPoints,
    num_panels: numPanels,
    total_power: actualPower,
    daily_consumption: dailyConsumption,
    annual_consumption: annualConsumption,
    battery_capacity: batteryCapacity,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: ((annualSavings * 25) / totalInvestment) * 100
  };
}

function calculateCommercialSystem(params: any) {
  const monthlyConsumption = parseFloat(params.monthly_consumption) || 0;
  const availableArea = parseFloat(params.available_area) || 0;
  
  const annualConsumption = monthlyConsumption * 12;
  const sunHours = 5.5;
  const systemEfficiency = 0.85;
  const requiredPower = (annualConsumption / (sunHours * 365 * systemEfficiency)) * 1000;
  
  const panelPower = 550;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000;
  const requiredArea = numPanels * 2.1;
  const annualGeneration = actualPower * sunHours * 365 * systemEfficiency;
  
  const costPerWatt = 4.2; // Commercial systems are slightly cheaper per watt
  const totalInvestment = actualPower * 1000 * costPerWatt;
  const energyTariff = 0.75; // Commercial tariff is higher
  const annualSavings = annualGeneration * energyTariff;
  const paybackYears = totalInvestment / annualSavings;
  
  return {
    num_panels: numPanels,
    total_power: actualPower,
    required_area: requiredArea,
    annual_generation: annualGeneration,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: ((annualSavings * 25) / totalInvestment) * 100,
    area_sufficient: availableArea >= requiredArea
  };
}

function calculateCommonAreasSystem(params: any) {
  const dailyConsumption = parseFloat(params.daily_consumption) || 0;
  const criticalConsumption = parseFloat(params.critical_consumption_per_hour) || 0;
  const backupHours = parseFloat(params.backup_hours) || 8;
  
  const annualConsumption = dailyConsumption * 365;
  const sunHours = 5.5;
  const systemEfficiency = 0.85;
  const requiredPower = (dailyConsumption / (sunHours * systemEfficiency)) * 1000;
  
  const panelPower = 550;
  const numPanels = Math.ceil(requiredPower / panelPower);
  const actualPower = numPanels * panelPower / 1000;
  
  const batteryCapacity = criticalConsumption * backupHours;
  const costPerWatt = 4.5;
  const batteryCostPerKWh = 800;
  const totalInvestment = (actualPower * 1000 * costPerWatt) + (batteryCapacity * batteryCostPerKWh);
  
  const energyTariff = 0.65;
  const annualSavings = annualConsumption * energyTariff;
  const paybackYears = totalInvestment / annualSavings;
  
  return {
    num_panels: numPanels,
    total_power: actualPower,
    daily_consumption: dailyConsumption,
    annual_consumption: annualConsumption,
    battery_capacity: batteryCapacity,
    backup_hours: backupHours,
    total_investment: totalInvestment,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    roi_percentage: ((annualSavings * 25) / totalInvestment) * 100
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      // In production, use proper bcrypt comparison
      const validPassword = password === "demo123" && email === "demo@auton.com";
      if (!validPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      await storage.updateUserLastLogin(user.id);
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      const { hashedPassword, ...userWithoutPassword } = user;
      
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        hashedPassword,
      });
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      const { hashedPassword: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    const { hashedPassword, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  // User stats
  app.get("/api/users/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Simulations routes
  app.get("/api/simulations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const simulations = await storage.getSimulationsByUser(req.user!.id);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar simulações" });
    }
  });

  app.get("/api/simulations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation || simulation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      res.json(simulation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar simulação" });
    }
  });

  app.post("/api/simulations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const simulationData = insertSimulationSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const simulation = await storage.createSimulation(simulationData);
      res.status(201).json(simulation);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.post("/api/simulations/:id/calculate", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation || simulation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      let results;
      const params = simulation.parameters as any;
      
      switch (simulation.type) {
        case 'residential':
          results = calculateResidentialSystem(params);
          break;
        case 'ev_charging':
          results = calculateEVChargingSystem(params);
          break;
        case 'commercial':
          results = calculateCommercialSystem(params);
          break;
        case 'common_areas':
          results = calculateCommonAreasSystem(params);
          break;
        default:
          return res.status(400).json({ message: "Tipo de simulação inválido" });
      }
      
      const updatedSimulation = await storage.updateSimulation(id, {
        results,
        status: 'calculated',
      });
      
      res.json(updatedSimulation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao calcular simulação" });
    }
  });

  app.put("/api/simulations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation || simulation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      const updateData = insertSimulationSchema.partial().parse(req.body);
      const updatedSimulation = await storage.updateSimulation(id, updateData);
      
      res.json(updatedSimulation);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/simulations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation || simulation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      const deleted = await storage.deleteSimulation(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Erro ao deletar simulação" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar simulação" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
