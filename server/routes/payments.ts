import type { Express, Response, Request } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middlewares/auth";
import { upgradeToPremiumSchema } from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe only if secret is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
}

/**
 * Payments and Plans Routes
 * Handles Stripe payments, plan upgrades, and subscription management
 */
export function registerPaymentRoutes(app: Express) {
  // Get available plans
  app.get("/api/plans", async (req: Request, res: Response) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar planos" });
    }
  });

  // Create payment intent for solar system custom pricing
  app.post("/api/create-payment-intent", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Pagamentos não disponíveis no momento" });
      }

      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'brl',
        metadata: {
          userId: req.user!.id.toString(),
          type: 'solar_system'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Erro ao criar payment intent:', error);
      res.status(500).json({ message: "Erro ao processar pagamento" });
    }
  });

  // Upgrade to premium
  app.post("/api/upgrade-to-premium", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { planId, paymentMethod } = upgradeToPremiumSchema.parse(req.body);
      
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }

      // In test mode, we'll just upgrade the user without payment
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      const updatedUser = await storage.upgradeUserPlan(req.user!.id, 'premium', expiresAt);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar plano" });
      }

      const { hashedPassword, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Upgrade realizado com sucesso!",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      res.status(500).json({ message: "Erro ao processar upgrade" });
    }
  });

  // Create Stripe checkout session for subscription
  app.post("/api/payments/upgrade", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Pagamentos não disponíveis no momento" });
      }

      const { planId } = req.body;
      const plan = await storage.getPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: {
              name: plan.displayName,
              description: 'Assinatura AUTON® ' + plan.displayName,
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/upgrade?success=true`,
        cancel_url: `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/upgrade?canceled=true`,
        metadata: {
          userId: req.user!.id.toString(),
          planId: planId.toString(),
        },
      });

      res.json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      res.status(500).json({ message: "Erro ao processar pagamento" });
    }
  });
}
