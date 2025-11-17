import { z } from "zod";

/**
 * API Response Contracts
 * Shared DTOs between frontend and backend
 */

// Generic API Response wrapper
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Auth Responses
export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    company: z.string().nullable(),
    role: z.enum(["admin", "user", "manager", "demo"]),
    plan: z.enum(["demo", "gratuito", "premium"]),
    maxSimulations: z.number(),
    isActive: z.boolean(),
  }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const userInfoResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  company: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(["admin", "user", "manager", "demo"]),
  plan: z.enum(["demo", "gratuito", "premium"]),
  planExpiresAt: z.string().nullable(),
  maxSimulations: z.number(),
  isActive: z.boolean(),
  remainingSimulations: z.number(),
  hasAccess: z.boolean(),
  createdAt: z.string(),
});

export type UserInfoResponse = z.infer<typeof userInfoResponseSchema>;

// Simulation Responses
export const simulationResponseSchema = z.object({
  id: z.number(),
  userId: z.number().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  type: z.enum(["residential", "commercial", "ev_charging", "common_areas", "multi_unit"]),
  parameters: z.record(z.any()),
  results: z.record(z.any()).nullable(),
  status: z.enum(["draft", "calculated", "approved", "completed"]),
  totalUnits: z.number(),
  hasCommonAreas: z.boolean(),
  hasEvCharging: z.boolean(),
  projectType: z.enum(["single", "residential_complex", "commercial_complex", "mixed_use"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SimulationResponse = z.infer<typeof simulationResponseSchema>;

export const simulationListResponseSchema = z.array(simulationResponseSchema);

export type SimulationListResponse = z.infer<typeof simulationListResponseSchema>;

export const calculateResultsResponseSchema = z.object({
  simulation: simulationResponseSchema,
  message: z.string().optional(),
});

export type CalculateResultsResponse = z.infer<typeof calculateResultsResponseSchema>;

// Dashboard Responses
export const userStatsResponseSchema = z.object({
  totalSimulations: z.number(),
  activeProjects: z.number(),
  totalSavings: z.number(),
  totalPower: z.number(),
});

export type UserStatsResponse = z.infer<typeof userStatsResponseSchema>;

export const planAccessResponseSchema = z.object({
  hasAccess: z.boolean(),
  remainingSimulations: z.number(),
  maxSimulations: z.number(),
  plan: z.enum(["demo", "gratuito", "premium"]),
});

export type PlanAccessResponse = z.infer<typeof planAccessResponseSchema>;

// Payment Responses
export const createCheckoutResponseSchema = z.object({
  sessionId: z.string(),
  url: z.string(),
});

export type CreateCheckoutResponse = z.infer<typeof createCheckoutResponseSchema>;

export const paymentStatusResponseSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  amount: z.number(),
  currency: z.string(),
  planName: z.string().optional(),
});

export type PaymentStatusResponse = z.infer<typeof paymentStatusResponseSchema>;

// Plan Responses
export const planResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  displayName: z.string(),
  price: z.number(),
  currency: z.string(),
  maxSimulations: z.number(),
  features: z.array(z.string()).nullable(),
  isActive: z.boolean(),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;

export const plansListResponseSchema = z.array(planResponseSchema);

export type PlansListResponse = z.infer<typeof plansListResponseSchema>;

// AI Advisor Responses
export const aiAdvisorResponseSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()).optional(),
  calculations: z.record(z.any()).optional(),
});

export type AIAdvisorResponse = z.infer<typeof aiAdvisorResponseSchema>;

// Report Generation
export const reportGenerationResponseSchema = z.object({
  format: z.enum(["pdf", "excel", "json"]),
  filename: z.string(),
  data: z.string(), // Base64 encoded for binary formats
});

export type ReportGenerationResponse = z.infer<typeof reportGenerationResponseSchema>;

// Error Response
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Success Response
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});

export type SuccessResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

/**
 * Helper function to create typed API responses
 */
export function createSuccessResponse<T>(message: string, data?: T): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function createErrorResponse(error: string, message?: string, details?: any): ErrorResponse {
  return {
    error,
    message,
    details,
  };
}

/**
 * Type guards for API responses
 */
export function isAuthResponse(data: unknown): data is AuthResponse {
  return authResponseSchema.safeParse(data).success;
}

export function isUserInfoResponse(data: unknown): data is UserInfoResponse {
  return userInfoResponseSchema.safeParse(data).success;
}

export function isSimulationResponse(data: unknown): data is SimulationResponse {
  return simulationResponseSchema.safeParse(data).success;
}

export function isErrorResponse(data: unknown): data is ErrorResponse {
  return errorResponseSchema.safeParse(data).success;
}
