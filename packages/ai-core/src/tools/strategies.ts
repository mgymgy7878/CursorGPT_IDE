/**
 * getStrategies & getStrategy Tools
 *
 * Retrieves strategy list and details.
 * Read-only tools for strategy inspection.
 */

import { z } from 'zod';
import { createHash } from 'crypto';
import type { ToolDefinition, ToolContext, ToolResult } from './types.js';
import { toolRegistry } from './registry.js';

// ============================================
// getStrategies Tool
// ============================================

const GetStrategiesSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'stopped', 'archived']).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
  cursor: z.string().optional(),
});

async function getStrategiesHandler(
  params: z.infer<typeof GetStrategiesSchema>,
  _ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { status, limit = 10, cursor } = params;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
    const url = new URL(`${baseUrl}/api/strategies`);
    if (status) url.searchParams.set('status', status);
    url.searchParams.set('limit', limit.toString());
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch strategies: ${response.status}`,
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    const data = await response.json() as {
      strategies?: Array<{
        id: string;
        name: string;
        status: string;
        symbol?: string;
        timeframe?: string;
        updatedAt?: string;
        metrics?: any;
      }>;
      count?: number;
      hasMore?: boolean;
      nextCursor?: string | null;
      _err?: string;
    };

    // Handle executor errors (returns empty array with _err)
    if (data._err) {
      return {
        success: true, // Still success, just empty data
        data: {
          strategies: [],
          count: 0,
          hasMore: false,
          nextCursor: null,
          _warn: data._err,
        },
      };
    }

    const strategies = (data.strategies || []).map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      symbol: s.symbol || null,
      timeframe: s.timeframe || null,
      updatedAt: s.updatedAt || null,
      metrics: s.metrics || null, // Don't fail if metrics missing
    }));

    return {
      success: true,
      data: {
        strategies,
        count: data.count ?? strategies.length,
        hasMore: data.hasMore ?? false,
        nextCursor: data.nextCursor ?? null,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch strategies',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

// ============================================
// getStrategy Tool
// ============================================

const GetStrategySchema = z.object({
  id: z.string().min(1),
  includeCode: z.boolean().optional().default(false), // P0.7: default false (P1'de açılabilir)
});

async function getStrategyHandler(
  params: z.infer<typeof GetStrategySchema>,
  _ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { id, includeCode = false } = params;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';

    // Try /api/strategies/:id first, fallback to executor if needed
    let url = `${baseUrl}/api/strategies/${id}`;

    // If endpoint doesn't exist, we'll get 404 and handle it
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) {
      return {
        success: false,
        error: `Strategy with id "${id}" not found`,
        errorCode: 'NOT_FOUND',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch strategy: ${response.status}`,
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    const strategy = await response.json() as {
      id: string;
      name: string;
      code?: string;
      status: string;
      symbol?: string;
      timeframe?: string;
      params?: any;
      createdAt?: string;
      updatedAt?: string;
      metrics?: any;
    };

    // P0.7: Code preview (first 4-8KB) + hash for security
    const code = strategy.code || '';
    const codeHash = code ? createHash('sha256').update(code).digest('hex') : null;

    // Default: codePreview only (4KB limit for preview)
    const codePreviewLimit = 4 * 1024; // 4KB
    const codePreview = code.length > codePreviewLimit
      ? code.slice(0, codePreviewLimit) + '\n... [truncated]'
      : code;

    const result: {
      id: string;
      name: string;
      status: string;
      symbol: string | null;
      timeframe: string | null;
      updatedAt: string | null;
      codePreview?: string;
      codeHash?: string;
      code?: string; // Only if includeCode: true
      params?: any;
      metrics?: any;
    } = {
      id: strategy.id,
      name: strategy.name,
      status: strategy.status,
      symbol: strategy.symbol || null,
      timeframe: strategy.timeframe || null,
      updatedAt: strategy.updatedAt || null,
      codePreview,
      codeHash,
      params: strategy.params || null,
      metrics: strategy.metrics || null,
    };

    // P1: includeCode flag (P0.7'de kapalı)
    if (includeCode) {
      result.code = code;
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    // Network/timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        success: false,
        error: 'Request timeout',
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to fetch strategy',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

// ============================================
// Register Tools
// ============================================

export function registerStrategiesTools(): void {
  const getStrategiesTool: ToolDefinition = {
    name: 'getStrategies',
    description: 'List strategies with optional filtering by status. Returns paginated results with cursor support.',
    category: 'read-only',
    defaultDryRun: false,
    schema: GetStrategiesSchema,
    handler: getStrategiesHandler,
    policy: {
      requiredRoles: [], // Everyone can list strategies
    },
  };

  const getStrategyTool: ToolDefinition = {
    name: 'getStrategy',
    description: 'Get detailed information about a specific strategy by ID. Returns code preview (4KB) and hash by default. Use includeCode: true to get full code (P1 feature).',
    category: 'read-only',
    defaultDryRun: false,
    schema: GetStrategySchema,
    handler: getStrategyHandler,
    policy: {
      requiredRoles: [], // Everyone can view strategy details
    },
  };

  toolRegistry.register(getStrategiesTool);
  toolRegistry.register(getStrategyTool);
}

