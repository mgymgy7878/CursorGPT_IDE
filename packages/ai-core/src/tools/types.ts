/**
 * Tool Types
 *
 * Core types for tool registry, execution, and results.
 */

import type { z } from 'zod';

export type ToolCategory = 'read-only' | 'stateful';

/**
 * Tool Error Codes (Union type for type safety)
 */
export type ToolErrorCode =
  | 'TOOL_NOT_FOUND'
  | 'INVALID_PARAMS'
  | 'PERMISSION_DENIED'
  | 'POLICY_DENIED'
  | 'EXECUTION_ERROR'
  | 'CLIENT_ABORT'
  | 'INTERNAL_ERROR'
  | 'TOOL_LIMIT_EXCEEDED'
  | 'PAYLOAD_TOO_LARGE'
  | 'DATA_UNAVAILABLE'
  | 'STALENESS_WARNING'
  | 'NOT_FOUND'
  | 'NOT_READY'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_USED'
  | 'TOKEN_INVALID';

export interface ToolContext {
  userId: string;
  userRole: string;
  requestId: string;
  dryRun: boolean;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: ToolErrorCode;
  confirmRequired?: boolean;
  auditLog?: AuditLogEntry;
}

export interface AuditLogEntry {
  requestId: string;
  timestamp: number;
  actor: string;
  role: string;
  tool: string;
  params: Record<string, any>;
  paramsHash: string;
  result?: Record<string, any>;
  resultHash?: string;
  dryRun: boolean;
  confirmRequired: boolean;
  confirmed?: boolean;
  confirmedBy?: string;
  confirmedAt?: number;
  prevHash?: string;
  auditHash: string;
  elapsedMs?: number;
  ok?: boolean;
  errorCode?: ToolErrorCode;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  defaultDryRun: boolean;
  schema: z.ZodSchema;
  handler: (params: any, ctx: ToolContext) => Promise<ToolResult>;
  policy?: {
    requiredRoles?: string[];
    riskChecks?: string[];
  };
}

/**
 * Tool call from LLM (JSON command mode)
 *
 * In v0, we use controlled JSON command mode instead of function calling.
 * LLM produces this JSON structure when it wants to call a tool.
 */
export interface ToolCall {
  tool: string;
  params: Record<string, any>;
  requestId?: string;
}

