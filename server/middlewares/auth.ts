import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import type { User } from "@shared/schema";
import { env } from "../config/env";

// Get JWT secret from validated env config
const JWT_SECRET = env.jwtSecret;

// Extend Request to include user
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to authenticate JWT tokens
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
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

/**
 * Middleware to check if user has access to simulations based on plan
 */
export async function checkPlanAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  try {
    const userSimulations = await storage.getSimulationsByUser(req.user.id);
    const maxSimulations = req.user.maxSimulations || 5;

    // -1 means unlimited (premium plan)
    if (maxSimulations === -1) {
      return next();
    }

    if (userSimulations.length >= maxSimulations) {
      return res.status(403).json({
        message: 'Limite de simulações atingido',
        maxSimulations,
        currentCount: userSimulations.length,
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking plan access:', error);
    return res.status(500).json({ message: 'Erro ao verificar acesso ao plano' });
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}
