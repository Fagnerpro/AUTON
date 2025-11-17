import { z } from "zod";

/**
 * Environment Configuration and Validation
 * Validates critical environment variables on startup
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters for security"),
  
  // Stripe (optional in development)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLIC_KEY: z.string().optional(),
  
  // OpenAI (optional)
  OPENAI_API_KEY: z.string().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Port
  PORT: z.string().default("5000"),
});

export type Env = z.infer<typeof envSchema>;

// Store validated config
let validatedConfig: Env | null = null;

/**
 * Validate and load environment variables
 * Throws error if critical variables are missing or invalid
 * Auto-runs on first import
 */
export function validateEnv(): Env {
  if (validatedConfig) {
    return validatedConfig;
  }

  try {
    validatedConfig = envSchema.parse(process.env);
    
    // Log validation success
    console.log("✅ Environment variables validated successfully");
    
    // Warn about optional missing vars
    if (!validatedConfig.STRIPE_SECRET_KEY) {
      console.warn("⚠️  STRIPE_SECRET_KEY not set - payment features disabled");
    }
    
    if (!validatedConfig.OPENAI_API_KEY) {
      console.warn("⚠️  OPENAI_API_KEY not set - AI assistant features disabled");
    }
    
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      
      // Provide helpful hints for common issues
      console.error("\n💡 Hints:");
      console.error("  - Make sure JWT_SECRET is set and at least 32 characters");
      console.error("  - DATABASE_URL should be set by Replit automatically");
      console.error("  - Use Secrets tab in Replit to set environment variables");
      
      throw new Error("Environment validation failed. Check the errors above.");
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Call validateEnv() first to ensure config is loaded
 */
export const env = {
  get database() {
    if (!validatedConfig) throw new Error("Call validateEnv() first");
    return validatedConfig.DATABASE_URL;
  },
  get jwtSecret() {
    if (!validatedConfig) throw new Error("Call validateEnv() first");
    return validatedConfig.JWT_SECRET;
  },
  get stripeSecretKey() {
    if (!validatedConfig) throw new Error("Call validateEnv() first");
    return validatedConfig.STRIPE_SECRET_KEY;
  },
  get stripePublicKey() {
    if (!validatedConfig) throw new Error("Call validateEnv() first");
    return validatedConfig.STRIPE_PUBLIC_KEY;
  },
  get openaiApiKey() {
    if (!validatedConfig) throw new Error("Call validateEnv() first");
    return validatedConfig.OPENAI_API_KEY;
  },
  get nodeEnv() {
    if (!validatedConfig) throw new Error("Call validateEnv() first");
    return validatedConfig.NODE_ENV;
  },
  get port() {
    if (!validatedConfig) throw new Error("Call validateEnv() first");
    return parseInt(validatedConfig.PORT);
  },
  get isProduction() {
    return this.nodeEnv === "production";
  },
  get isDevelopment() {
    return this.nodeEnv === "development";
  },
};

// Auto-validate on module load
validateEnv();
