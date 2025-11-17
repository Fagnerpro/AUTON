import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertSimulationSchema } from "@shared/schema";
import { authenticateToken, checkPlanAccess, type AuthRequest } from "../middlewares/auth";

/**
 * Simulations Routes
 * Handles CRUD operations for solar simulations
 */
export function registerSimulationRoutes(app: Express) {
  // Get all user simulations
  app.get("/api/simulations", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const simulations = await storage.getSimulationsByUser(req.user!.id);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar simulações" });
    }
  });

  // Get single simulation
  app.get("/api/simulations/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      // Admin can access any simulation, users only their own
      if (req.user!.role !== 'admin' && simulation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      res.json(simulation);
    } catch (error) {
      console.error('Error fetching simulation:', error);
      res.status(500).json({ message: "Erro ao buscar simulação" });
    }
  });

  // Create demo simulation (no auth required)
  app.post("/api/simulations/demo", async (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                       req.headers['x-real-ip'] as string ||
                       req.socket.remoteAddress || 
                       req.ip || 
                       'unknown';
      const userAgent = req.headers['user-agent'];
      
      const demoLimit = await storage.checkDemoSimulationLimit(clientIp, userAgent);
      if (!demoLimit.canCreate) {
        return res.status(429).json({ 
          message: "Limite de simulação demo atingido. Uma simulação demo por IP nas últimas 24 horas.",
          count: demoLimit.count
        });
      }
      
      const simulationData = insertSimulationSchema.omit({ userId: true }).parse(req.body);
      const simulation = await storage.createSimulation({
        ...simulationData,
        userId: null,
      });
      
      await storage.recordDemoSimulation(clientIp, userAgent);
      res.status(201).json(simulation);
    } catch (error) {
      console.error('Erro ao criar simulação demo:', error);
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Create simulation (authenticated)
  app.post("/api/simulations", authenticateToken, checkPlanAccess, async (req: AuthRequest, res: Response) => {
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

  // Calculate demo simulation
  app.post("/api/simulations/demo/:id/calculate", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation || simulation.userId !== null) {
        return res.status(404).json({ message: "Simulação demo não encontrada" });
      }
      
      const results = await storage.calculateSimulationResults(simulation);
      const updatedSimulation = await storage.updateSimulation(id, {
        results,
        status: 'calculated',
      });
      
      res.json(updatedSimulation);
    } catch (error) {
      console.error('Erro ao calcular simulação demo:', error);
      res.status(500).json({ message: "Erro ao calcular simulação: " + (error as Error).message });
    }
  });

  // Calculate simulation
  app.post("/api/simulations/:id/calculate", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      if (req.user!.role !== 'admin' && simulation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
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

  // Update simulation
  app.put("/api/simulations/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      if (req.user!.role !== 'admin' && simulation.userId !== req.user!.id) {
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

  // Delete simulation
  app.delete("/api/simulations/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
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
}
