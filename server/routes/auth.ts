import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from "@shared/schema";
import { generateToken, authenticateToken, type AuthRequest } from "../middlewares/auth";
import bcrypt from "bcrypt";

/**
 * Authentication and User Routes
 * Handles login, registration, password reset, user profile
 */
export function registerAuthRoutes(app: Express) {
  // Demo route - creates a temporary demo user with IP limitation
  app.post("/api/auth/demo", async (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                       req.headers['x-real-ip'] as string ||
                       req.socket.remoteAddress || 
                       req.ip || 
                       'unknown';
      const userAgent = req.headers['user-agent'];

      const demoLimit = await storage.checkDemoSimulationLimit(clientIp, userAgent);
      if (!demoLimit.canCreate && demoLimit.count >= 2) {
        return res.status(429).json({ 
          message: "Limite de acesso demo atingido. Apenas 2 acessos demo por IP a cada 24 horas. Crie uma conta Premium para acesso ilimitado.",
          canCreate: false,
          count: demoLimit.count
        });
      }

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

      const token = generateToken(demoUser.id);
      await storage.recordDemoSimulation(clientIp, userAgent);

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

  // Admin route - creates admin user with premium access for testing
  app.post("/api/auth/admin", async (req: Request, res: Response) => {
    try {
      const adminEmail = `admin_${Date.now()}@auton.admin`;
      const adminUser = await storage.createUser({
        email: adminEmail,
        name: "Administrador AUTON",
        company: "AUTON® Administração",
        phone: null,
        role: "admin",
        plan: "premium",
        maxSimulations: -1,
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        isVerified: true,
        hashedPassword: await bcrypt.hash("admin123", 10),
      });

      const token = generateToken(adminUser.id);
      const { hashedPassword, ...userWithoutPassword } = adminUser;

      res.json({
        token,
        user: userWithoutPassword,
        isAdminUser: true
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar usuário admin" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      if (user.plan === "gratuito" || user.plan === "demo") {
        return res.status(403).json({ 
          message: "Acesso restrito. É necessário uma assinatura ativa para fazer login.",
          requiresSubscription: true
        });
      }
      
      const validPassword = await storage.verifyPassword(password, user.hashedPassword);
      if (!validPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      await storage.updateUserLastLogin(user.id);
      const token = generateToken(user.id);
      const { hashedPassword, ...userWithoutPassword } = user;
      
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
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
      
      const token = generateToken(user.id);
      const { hashedPassword: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    const { hashedPassword, ...userWithoutPassword } = req.user!;
    
    const userSimulations = await storage.getSimulationsByUser(req.user!.id);
    const access = await storage.checkUserPlanAccess(req.user!.id);
    
    res.json({
      ...userWithoutPassword,
      remainingSimulations: access.remainingSimulations,
      hasAccess: access.hasAccess,
    });
  });

  // Logout
  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res: Response) => {
    res.json({ message: "Logout realizado com sucesso" });
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = resetPasswordSchema.parse(req.body);
      const token = await storage.createResetToken(email);
      
      if (token) {
        console.log(`Reset token for ${email}: ${token}`);
      }
      
      res.json({ 
        message: "Se o email existir, você receberá instruções para redefinir sua senha.",
        resetToken: token
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = updatePasswordSchema.parse(req.body);
      const user = await storage.verifyResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updatePassword(user.id, hashedPassword);
      await storage.clearResetToken(user.id);
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // User stats
  app.get("/api/users/stats", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Update user profile
  app.put("/api/users/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { name, company, phone } = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, { name, company, phone });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { hashedPassword, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Update user preferences
  app.put("/api/users/preferences", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      res.json({ message: "Preferências atualizadas com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar preferências" });
    }
  });

  // Get plan access
  app.get("/api/users/plan-access", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const access = await storage.checkUserPlanAccess(req.user!.id);
      res.json(access);
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar acesso" });
    }
  });
}
