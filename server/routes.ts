import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiAdvisor } from "./services/ai-advisor";
import { 
  loginSchema, 
  registerSchema, 
  insertSimulationSchema, 
  resetPasswordSchema,
  updatePasswordSchema,
  upgradeToPremiumumSchema,
  type User 
} from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Stripe from "stripe";

// Initialize Stripe only if secret is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

const JWT_SECRET = process.env.JWT_SECRET || "auton-solar-secret-key";

// Report generation function
async function generateReport(simulation: any, format: string): Promise<Buffer | string> {
  const results = simulation.results;
  
  if (format === 'json') {
    return JSON.stringify({
      simulation: {
        id: simulation.id,
        name: simulation.name,
        type: simulation.type,
        created: simulation.createdAt,
        status: simulation.status,
        total_units: simulation.totalUnits || 1
      },
      parameters: simulation.parameters,
      results: results,
      generated_at: new Date().toISOString()
    }, null, 2);
  }
  
  if (format === 'excel') {
    const totalUnits = simulation.totalUnits || 1;
    const projectInfo = results.project_info;
    
    const csvData = [
      ['Relatório de Simulação Solar AUTON®', ''],
      ['Nome do Projeto', simulation.name],
      ['Tipo', simulation.type],
      ['Data de Criação', new Date(simulation.createdAt).toLocaleDateString('pt-BR')],
      ['', ''],
      ['Informações do Projeto', ''],
      ['Número Total de Unidades', totalUnits],
      ...(projectInfo ? [
        ['Investimento por Unidade (R$)', projectInfo.unit_investment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0],
        ['Economia Mensal por Unidade (R$)', projectInfo.unit_savings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0]
      ] : []),
      ['', ''],
      ['Especificações Técnicas Totais', ''],
      ['Potência Instalada Total (kWp)', results.system_power?.toFixed(2) || 0],
      ['Número Total de Painéis', results.num_panels || 0],
      ['Geração Mensal Total (kWh)', results.monthly_generation?.toFixed(0) || 0],
      ['Geração Anual Total (kWh)', results.annual_generation?.toFixed(0) || 0],
      ['Área Total Necessária (m²)', results.required_area?.toFixed(2) || 0],
      ['Cobertura do Consumo (%)', results.coverage_percentage?.toFixed(1) || 0],
      ['', ''],
      ['Análise Financeira Total', ''],
      ['Investimento Total (R$)', results.total_investment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0],
      ['Economia Mensal Total (R$)', results.monthly_savings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0],
      ['Economia Anual Total (R$)', results.annual_savings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0],
      ['Payback (anos)', results.payback_years?.toFixed(1) || 0],
      ['ROI 25 anos (%)', results.roi_percentage?.toFixed(1) || 0],
      ['', ''],
      ['Observações', ''],
      ['Sistema calculado para ' + totalUnits + (totalUnits > 1 ? ' unidades' : ' unidade'), ''],
      ['Valores já incluem multiplicação por número de unidades', ''],
      ['Relatório gerado pelo AUTON® em ' + new Date().toLocaleString('pt-BR'), '']
    ].map(row => row.join(',')).join('\n');
    
    return Buffer.from('\uFEFF' + csvData, 'utf-8'); // Add BOM for proper Excel UTF-8 handling
  }
  
  // PDF format - comprehensive multi-unit report
  const totalUnits = simulation.totalUnits || 1;
  const projectInfo = results.project_info;
  
  const pdfContent = `RELATÓRIO DE SIMULAÇÃO SOLAR AUTON®
========================================

INFORMAÇÕES DO PROJETO
----------------------
Projeto: ${simulation.name}
Tipo: ${simulation.type}
Data: ${new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
Número de Unidades: ${totalUnits}
Status: ${simulation.status}

${projectInfo ? `
VALORES POR UNIDADE
-------------------
Investimento por Unidade: R$ ${projectInfo.unit_investment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}
Economia Mensal por Unidade: R$ ${projectInfo.unit_savings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}
` : ''}

ESPECIFICAÇÕES TÉCNICAS TOTAIS
------------------------------
Potência Total Instalada: ${results.system_power?.toFixed(2) || 0} kWp
Número Total de Painéis: ${results.num_panels || 0}
Geração Mensal Total: ${results.monthly_generation?.toLocaleString('pt-BR') || 0} kWh
Geração Anual Total: ${results.annual_generation?.toLocaleString('pt-BR') || 0} kWh
Área Total Necessária: ${results.required_area?.toFixed(2) || 0} m²
Cobertura do Consumo: ${results.coverage_percentage?.toFixed(1) || 0}%

ANÁLISE FINANCEIRA TOTAL
------------------------
Investimento Total: R$ ${results.total_investment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 0}
Economia Mensal: R$ ${results.financial_analysis?.monthly_savings || 0}
Economia Anual: R$ ${results.financial_analysis?.annual_savings || 0}
Payback: ${results.financial_analysis?.payback_years || 0} anos
ROI (25 anos): ${results.financial_analysis?.roi_25_years || 0}%
Lucro Líquido (25 anos): R$ ${results.financial_analysis?.net_profit_25_years || 0}

IMPACTO AMBIENTAL
-----------------
CO2 evitado anualmente: ${results.environmental_impact?.co2_avoided_annually || 0} kg
Equivalente em árvores: ${results.environmental_impact?.trees_equivalent || 0}

Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`;
  
  return Buffer.from(pdfContent, 'utf-8');
}

interface AuthRequest extends Express.Request {
  user?: User;
}

// Middleware to verify JWT token
function authenticateToken(req: AuthRequest, res: Express.Response, next: Express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Token inválido' });
    }

    try {
      const user = await storage.getUser(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(403).json({ message: 'Usuário não encontrado ou inativo' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
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
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Demo route - creates a temporary demo user
  app.post("/api/auth/demo", async (req, res) => {
    try {
      // Create temporary demo user
      const demoEmail = `demo_${Date.now()}@auton.demo`;
      const demoUser = await storage.createUser({
        email: demoEmail,
        name: "Usuário Demo",
        company: "Demonstração AUTON®",
        phone: null,
        role: "demo",
        plan: "demo",
        maxSimulations: 1,
        isActive: true,
        isVerified: true,
        hashedPassword: await bcrypt.hash("demo123", 10),
      });

      const token = jwt.sign(
        { userId: demoUser.id, email: demoUser.email },
        JWT_SECRET,
        { expiresIn: "24h" } // Demo token expires in 24 hours
      );

      const { hashedPassword, ...userWithoutPassword } = demoUser;

      res.json({
        token,
        user: userWithoutPassword,
        isDemoUser: true
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar usuário demo" });
    }
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      // Verify password using bcrypt
      const validPassword = await storage.verifyPassword(password, user.hashedPassword);
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
      
      // Create user with only the fields needed for InsertUser
      const user = await storage.createUser({
        email: userData.email,
        name: userData.name,
        company: userData.company,
        phone: userData.phone,
        role: "user",
        plan: "gratuito",
        maxSimulations: 5,
        isActive: true,
        isVerified: false,
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

  // Middleware para verificar acesso de plano
  const checkPlanAccess = async (req: AuthRequest, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const access = await storage.checkUserPlanAccess(req.user.id);
    if (!access.hasAccess) {
      return res.status(403).json({ 
        message: "Limite de simulações atingido. Faça upgrade para o plano Premium.",
        plan: access.plan,
        remainingSimulations: access.remainingSimulations
      });
    }

    next();
  };

  app.post("/api/simulations", authenticateToken, checkPlanAccess, async (req: AuthRequest, res) => {
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
      
      // Use the new calculation engine
      const results = await storage.calculateSimulationResults(simulation);
      
      const updatedSimulation = await storage.updateSimulation(id, {
        results,
        status: 'calculated',
      });
      
      res.json(updatedSimulation);
    } catch (error) {
      console.error('Erro ao calcular simulação:', error);
      res.status(500).json({ message: "Erro ao calcular simulação: " + (error as Error).message });
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
      console.error('Erro ao atualizar simulação:', error);
      res.status(400).json({ message: "Dados inválidos: " + (error as Error).message });
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

  // Reports routes
  app.post("/api/reports/generate", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { simulationId, format } = req.body;
      const simulation = await storage.getSimulation(simulationId);
      
      if (!simulation || simulation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }

      if (!simulation.results) {
        return res.status(400).json({ message: "Simulação não foi calculada ainda" });
      }

      const reportData = await generateReport(simulation, format);
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${simulation.name}.pdf"`);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${simulation.name}.xlsx"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${simulation.name}.json"`);
      }
      
      res.send(reportData);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  });

  // User profile routes
  app.put("/api/users/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updateData = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { hashedPassword, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Erro ao atualizar perfil" });
    }
  });

  app.put("/api/users/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // For now, just return success - preferences would be stored in user profile
      res.json({ message: "Preferências atualizadas com sucesso" });
    } catch (error) {
      res.status(400).json({ message: "Erro ao atualizar preferências" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe não configurado" });
      }
      
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "brl",
        metadata: {
          userId: req.user!.id.toString(),
          plan: "premium"
        }
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ message: "Erro ao criar pagamento: " + error.message });
    }
  });

  // Upgrade to premium route
  app.post("/api/upgrade-to-premium", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe não configurado" });
      }
      
      const { paymentIntentId } = req.body;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && 
          paymentIntent.metadata.userId === req.user!.id.toString()) {
        
        // Upgrade user to premium
        const updatedUser = await storage.updateUser(req.user!.id, {
          plan: "premium",
          maxSimulations: 999,
          stripeCustomerId: paymentIntent.customer as string,
        });

        if (updatedUser) {
          const { hashedPassword, ...userWithoutPassword } = updatedUser;
          res.json({
            success: true,
            user: userWithoutPassword,
            message: "Upgrade realizado com sucesso!"
          });
        } else {
          res.status(500).json({ message: "Erro ao atualizar usuário" });
        }
      } else {
        res.status(400).json({ message: "Pagamento não foi processado corretamente" });
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      res.status(500).json({ message: "Erro no upgrade: " + error.message });
    }
  });

  // Plan routes
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar planos" });
    }
  });

  // Plan access check
  app.get("/api/users/plan-access", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const access = await storage.checkUserPlanAccess(req.user!.id);
      res.json(access);
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar acesso" });
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = resetPasswordSchema.parse(req.body);
      
      const resetToken = await storage.createResetToken(email);
      if (!resetToken) {
        // Don't reveal if email exists or not
        return res.json({ message: "Se o email existir, um link de reset será enviado" });
      }

      // In production, send email with reset link
      // For now, just return success
      res.json({ 
        message: "Link de reset enviado para o email",
        resetToken // In production, this would be sent via email
      });
    } catch (error) {
      res.status(400).json({ message: "Erro ao solicitar reset de senha" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = updatePasswordSchema.parse(req.body);
      
      const user = await storage.verifyResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      const hashedPassword = await storage.hashPassword(password);
      const success = await storage.updatePassword(user.id, hashedPassword);
      
      if (success) {
        res.json({ message: "Senha atualizada com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao atualizar senha" });
      }
    } catch (error) {
      res.status(400).json({ message: "Erro ao resetar senha" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // For now, just return success - in production, you'd invalidate the token
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro no logout" });
    }
  });

  // AI Advisor routes
  app.post("/api/ai/advice", authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    try {
      const { 
        context, 
        simulationData, 
        systemConfiguration, 
        specificQuestion 
      } = req.body;

      // Validate context
      const validContexts = ['simulation_analysis', 'pricing_guidance', 'technical_question', 'general_advice'];
      if (context && !validContexts.includes(context)) {
        return res.status(400).json({ message: "Contexto inválido" });
      }

      // Get user's simulations if not provided
      let userSimulations = simulationData;
      if (!userSimulations && (context === 'simulation_analysis' || !context)) {
        userSimulations = await storage.getUserSimulations(req.user.id);
      }

      // Prepare AI advisor request
      const adviceRequest = {
        context: context || 'general_advice',
        simulationData: userSimulations,
        userProfile: {
          name: req.user.name,
          company: req.user.company,
          plan: req.user.plan
        },
        specificQuestion,
        systemConfiguration
      };

      // Get advice from AI advisor
      const advice = await aiAdvisor.getContextualAdvice(adviceRequest);

      res.json(advice);
    } catch (error) {
      console.error('AI advice error:', error);
      res.status(500).json({ 
        message: "Erro ao gerar orientações IA",
        advice: "Desculpe, não foi possível gerar orientações no momento. Tente novamente em alguns instantes.",
        recommendations: ["Verifique sua conexão com a internet", "Tente refazer a pergunta de forma mais específica"],
        technicalTips: ["Entre em contato com suporte se o problema persistir"],
        nextSteps: ["Aguarde alguns instantes e tente novamente"],
        confidence: 0.1
      });
    }
  });

  // Specific AI analysis for simulations
  app.post("/api/ai/analyze-simulation/:id", authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    try {
      const simulationId = parseInt(req.params.id);
      const simulation = await storage.getSimulation(simulationId);

      if (!simulation || simulation.userId !== req.user.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }

      const advice = await aiAdvisor.analyzeSimulationOptimization(simulation);
      res.json(advice);
    } catch (error) {
      console.error('AI simulation analysis error:', error);
      res.status(500).json({ message: "Erro ao analisar simulação" });
    }
  });

  // AI pricing insights
  app.post("/api/ai/pricing-insights", authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    try {
      const { systemConfiguration, budget } = req.body;
      
      if (!systemConfiguration) {
        return res.status(400).json({ message: "Configuração do sistema é obrigatória" });
      }

      const advice = await aiAdvisor.getPricingInsights(systemConfiguration, budget);
      res.json(advice);
    } catch (error) {
      console.error('AI pricing insights error:', error);
      res.status(500).json({ message: "Erro ao gerar insights de preço" });
    }
  });

  // Payment upgrade route
  app.post("/api/payments/upgrade", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { planId, paymentMethod } = upgradeToPremiumumSchema.parse(req.body);
      
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }

      // Create payment record
      const payment = await storage.createPayment({
        userId: req.user!.id,
        planId,
        amount: plan.price,
        currency: plan.currency || "BRL",
        provider: paymentMethod,
        providerId: `test_${Date.now()}`,
        status: "completed",
        metadata: { upgrade: true }
      });

      // Upgrade user plan
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      const updatedUser = await storage.upgradeUserPlan(req.user!.id, plan.name, expiresAt);
      
      if (updatedUser) {
        const { hashedPassword, ...userWithoutPassword } = updatedUser;
        res.json({
          message: "Plano atualizado com sucesso",
          user: userWithoutPassword,
          payment
        });
      } else {
        res.status(500).json({ message: "Erro ao atualizar plano" });
      }
    } catch (error) {
      console.error('Erro no upgrade:', error);
      res.status(400).json({ message: "Erro ao fazer upgrade" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
