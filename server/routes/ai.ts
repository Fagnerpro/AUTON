import type { Express, Response } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middlewares/auth";
import { aiAdvisor } from "../services/ai-advisor";

/**
 * AI Assistant Routes
 * Handles AI-powered advisory, simulation analysis, and pricing insights
 */
export function registerAIRoutes(app: Express) {
  // General AI advice
  app.post("/api/ai/advice", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      // Check if user has premium plan
      if (req.user!.plan !== 'premium' && req.user!.role !== 'admin') {
        return res.status(403).json({ 
          message: "O Assistente AI é exclusivo para assinantes Premium. Faça upgrade para ter acesso ilimitado a recomendações personalizadas.",
          requiresUpgrade: true
        });
      }

      const { question, context } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Pergunta não fornecida" });
      }

      const aiResponse = await aiAdvisor.getContextualAdvice({
        context: context || 'general_advice',
        specificQuestion: question,
        userProfile: req.user
      });
      res.json({ response: aiResponse.advice, recommendations: aiResponse.recommendations });
    } catch (error) {
      console.error('Erro no assistente AI:', error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // AI analysis of simulation
  app.post("/api/ai/analyze-simulation/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      // Check if user has premium plan
      if (req.user!.plan !== 'premium' && req.user!.role !== 'admin') {
        return res.status(403).json({ 
          message: "A análise de simulações com AI é exclusiva para assinantes Premium.",
          requiresUpgrade: true
        });
      }

      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulation(id);
      
      if (!simulation) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }

      if (simulation.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (!simulation.results) {
        return res.status(400).json({ message: "Simulação ainda não foi calculada" });
      }

      const aiResponse = await aiAdvisor.getContextualAdvice({
        context: 'simulation_analysis',
        simulationData: [simulation],
        userProfile: req.user
      });
      res.json({ analysis: aiResponse.advice, recommendations: aiResponse.recommendations });
    } catch (error) {
      console.error('Erro ao analisar simulação:', error);
      res.status(500).json({ message: "Erro ao analisar simulação" });
    }
  });

  // AI pricing insights
  app.post("/api/ai/pricing-insights", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      // Check if user has premium plan
      if (req.user!.plan !== 'premium' && req.user!.role !== 'admin') {
        return res.status(403).json({ 
          message: "Insights de precificação são exclusivos para assinantes Premium.",
          requiresUpgrade: true
        });
      }

      const { simulationType, parameters } = req.body;
      const aiResponse = await aiAdvisor.getContextualAdvice({
        context: 'pricing_guidance',
        specificQuestion: `Insights de precificação para ${simulationType}`,
        systemConfiguration: parameters,
        userProfile: req.user
      });
      
      res.json({ insights: aiResponse.advice, recommendations: aiResponse.recommendations });
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      res.status(500).json({ message: "Erro ao gerar insights" });
    }
  });
}
