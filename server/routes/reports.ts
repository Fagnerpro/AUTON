import type { Express, Response } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middlewares/auth";
import { generateReport } from "../utils/report-generator";

/**
 * Reports Routes
 * Handles generation of PDF, Excel, and JSON reports
 */
export function registerReportRoutes(app: Express) {
  app.post("/api/reports/generate", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { simulationId, format } = req.body;
      
      console.log('📊 Gerando relatório:', { simulationId, format, userId: req.user?.id });
      
      const simulation = await storage.getSimulation(simulationId);
      
      if (!simulation) {
        console.log('❌ Simulação não encontrada:', simulationId);
        return res.status(404).json({ message: "Simulação não encontrada" });
      }
      
      if (simulation.userId !== req.user!.id) {
        console.log('❌ Acesso negado - usuário diferente:', { simulationUserId: simulation.userId, requestUserId: req.user!.id });
        return res.status(404).json({ message: "Simulação não encontrada" });
      }

      if (!simulation.results || Object.keys(simulation.results).length === 0) {
        console.log('❌ Simulação sem resultados:', { simulationId, results: simulation.results });
        return res.status(400).json({ message: "Simulação não foi calculada ainda" });
      }

      console.log('✅ Gerando relatório:', format);
      const reportData = await generateReport(simulation, format);
      
      if (format === 'json') {
        return res.json(JSON.parse(reportData as string));
      }
      
      const filename = `simulacao-${simulation.id}-${Date.now()}.${format === 'excel' ? 'csv' : 'txt'}`;
      const contentType = format === 'excel' 
        ? 'text/csv; charset=utf-8'
        : 'text/plain; charset=utf-8';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(reportData);
      
      console.log('✅ Relatório gerado com sucesso:', filename);
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      res.status(500).json({ message: "Erro ao gerar relatório: " + (error as Error).message });
    }
  });
}
