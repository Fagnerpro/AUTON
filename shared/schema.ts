import { pgTable, text, serial, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  name: text("name").notNull(),
  company: text("company"),
  phone: text("phone"),
  role: text("role", { enum: ["admin", "user", "manager"] }).notNull().default("user"),
  plan: text("plan", { enum: ["demo", "gratuito", "premium"] }).notNull().default("gratuito"),
  planExpiresAt: timestamp("plan_expires_at"),
  maxSimulations: integer("max_simulations").default(5), // 5 for free, -1 for unlimited
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Nullable para simulações demo
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  state: text("state").default("GO"),
  type: text("type", { enum: ["residential", "commercial", "ev_charging", "common_areas", "multi_unit"] }).notNull(),
  parameters: jsonb("parameters").notNull(),
  results: jsonb("results"),
  status: text("status", { enum: ["draft", "calculated", "approved", "completed"] }).notNull().default("draft"),
  // Campos para projetos multi-unidades
  totalUnits: integer("total_units").default(1),
  hasCommonAreas: boolean("has_common_areas").default(false),
  hasEvCharging: boolean("has_ev_charging").default(false),
  projectType: text("project_type", { enum: ["single", "residential_complex", "commercial_complex", "mixed_use"] }).default("single"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  price: real("price").notNull(),
  currency: text("currency").default("BRL"),
  maxSimulations: integer("max_simulations").default(-1), // -1 for unlimited
  features: jsonb("features").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => plans.id),
  amount: real("amount").notNull(),
  currency: text("currency").default("BRL"),
  provider: text("provider", { enum: ["stripe", "mercadopago", "test"] }).notNull(),
  providerId: text("provider_id").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed", "refunded"] }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tabela para controle de simulações demo por IP
export const demoSimulations = pgTable("demo_simulations", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  simulationCount: integer("simulation_count").default(1),
  lastSimulationAt: timestamp("last_simulation_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});

export const insertDemoSimulationSchema = createInsertSchema(demoSimulations).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
}).omit({
  hashedPassword: true,
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const updatePasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export const upgradeToPremiumSchema = z.object({
  planId: z.number(),
  paymentMethod: z.enum(["stripe", "mercadopago"]),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type DemoSimulation = typeof demoSimulations.$inferSelect;
export type InsertDemoSimulation = z.infer<typeof insertDemoSimulationSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;
export type UpgradeToPremiumRequest = z.infer<typeof upgradeToPremiumSchema>;
