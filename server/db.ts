import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with proper configuration for Replit environment
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Allow reasonable concurrent connections for web app
  idleTimeoutMillis: 30000, // 30 seconds - reduce connection churn
  connectionTimeoutMillis: 10000 // 10 seconds - allow for complex queries
});

export const db = drizzle({ client: pool, schema });
