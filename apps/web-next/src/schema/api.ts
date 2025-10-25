/**
 * API Response Schemas
 * 
 * Zod schemas for runtime validation of API responses.
 * Single source of truth for API contracts.
 */

import { z } from 'zod';

/**
 * Error budget response schema
 */
export const ErrorBudgetSchema = z.object({
  status: z.literal('OK'),
  errorBudget: z.number().min(0).max(1),
  updatedAt: z.string().datetime(),
  source: z.enum(['prometheus', 'mock']).optional()
});

export type ErrorBudget = z.infer<typeof ErrorBudgetSchema>;

/**
 * Engine health response schema
 */
export const EngineHealthSchema = z.object({
  status: z.literal('OK'),
  running: z.boolean(),
  updatedAt: z.string().datetime(),
  source: z.enum(['mock', 'real']).optional()
});

export type EngineHealth = z.infer<typeof EngineHealthSchema>;

/**
 * Market connection status
 */
export const MarketStatusSchema = z.enum(['idle', 'connecting', 'healthy', 'degraded', 'down']);

export type MarketStatus = z.infer<typeof MarketStatusSchema>;

/**
 * WebSocket message schema
 */
export const WsMessageSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  data: z.unknown().optional()
});

export type WsMessage = z.infer<typeof WsMessageSchema>;

/**
 * Generic API error schema
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.unknown().optional()
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Safe parse with fallback
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : fallback;
}

/**
 * Parse or throw with context
 */
export function parseOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    const ctx = context ? ` (${context})` : '';
    throw new Error(`Schema validation failed${ctx}: ${error}`);
  }
}

