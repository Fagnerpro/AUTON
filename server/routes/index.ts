import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth";
import { registerSimulationRoutes } from "./simulations";
import { registerReportRoutes } from "./reports";
import { registerPaymentRoutes } from "./payments";
import { registerAIRoutes } from "./ai";

/**
 * Register all application routes
 * Modular route organization following domain-driven design
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Root API endpoint
  app.all("/api", async (req: Request, res: Response) => {
    if (req.method === "HEAD") {
      return res.status(200).end();
    }
    res.json({
      name: "AUTON® API",
      version: "1.0.0",
      status: "ok",
      endpoints: {
        health: "/api/health",
        auth: "/api/auth/*",
        simulations: "/api/simulations/*",
        reports: "/api/reports/*",
        payments: "/api/payments/*",
        plans: "/api/plans",
        ai: "/api/ai/*"
      }
    });
  });

  // Health check endpoint
  app.get("/api/health", async (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Register domain-specific routes
  registerAuthRoutes(app);
  registerSimulationRoutes(app);
  registerReportRoutes(app);
  registerPaymentRoutes(app);
  registerAIRoutes(app);

  // Start HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
