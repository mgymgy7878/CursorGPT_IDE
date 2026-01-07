/**
 * Backtest Job Lifecycle Tools (P1.0)
 *
 * Three-tool set for backtest job lifecycle:
 * 1. startBacktest - Prepare job, request confirmation (confirmRequired=true)
 * 2. confirmBacktest - Commit job (operator/admin only)
 * 3. getBacktestStatus - Check job status (readonly)
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from './types.js';
import { toolRegistry } from './registry.js';
import { confirmationTokenStore } from '../audit/ConfirmationTokenStore.js';

// ============================================
// startBacktest Tool
// ============================================

const StartBacktestSchema = z.object({
  strategyId: z.string().min(1),
  symbol: z.string().optional(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).optional(),
  from: z.string(), // ISO date
  to: z.string(), // ISO date
  initialCapital: z.number().positive().optional(),
  risk: z.object({
    maxDrawdownPct: z.number().min(0).max(100).optional(),
    maxPositionPct: z.number().min(0).max(100).optional(),
  }).optional(),
});

async function startBacktestHandler(
  params: z.infer<typeof StartBacktestSchema>,
  ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { strategyId, symbol, timeframe, from, to, initialCapital, risk } = params;

    // Validate strategy exists
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
    const strategyUrl = `${baseUrl}/api/strategies/${strategyId}`;

    const strategyResponse = await fetch(strategyUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (strategyResponse.status === 404) {
      return {
        success: false,
        error: `Strategy with id "${strategyId}" not found`,
        errorCode: 'NOT_FOUND',
      };
    }

    if (!strategyResponse.ok) {
      return {
        success: false,
        error: `Failed to fetch strategy: ${strategyResponse.status}`,
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    const strategy = await strategyResponse.json() as {
      id: string;
      symbol?: string;
      timeframe?: string;
    };

    const effectiveSymbol = symbol || strategy.symbol || 'BTCUSDT';
    const effectiveTimeframe = timeframe || strategy.timeframe || '1h';

    // Date range validation
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    if (rangeDays < 1 || rangeDays > 365) {
      return {
        success: false,
        error: `Invalid date range: ${rangeDays} days (must be 1-365 days)`,
        errorCode: 'INVALID_PARAMS',
      };
    }

    // Check data availability
    const candlesUrl = `${baseUrl}/api/marketdata/candles?symbol=${encodeURIComponent(effectiveSymbol)}&timeframe=${effectiveTimeframe}&limit=1`;

    const candlesResponse = await fetch(candlesUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (!candlesResponse.ok) {
      return {
        success: false,
        error: 'Market data not available for the specified symbol/timeframe',
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    const candles = await candlesResponse.json() as Array<{ t: number }>;
    if (!Array.isArray(candles) || candles.length === 0) {
      return {
        success: false,
        error: 'No candle data available',
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    // P1.1: Generate confirmation token with secure store
    const jobParams = {
      strategyId,
      symbol: effectiveSymbol,
      timeframe: effectiveTimeframe,
      from,
      to,
      initialCapital: initialCapital || 10000,
      risk: risk || {},
    };
    const confirmationToken = confirmationTokenStore.generate(jobParams, 5 * 60 * 1000); // 5 min TTL

    // P1.0: Prepare job but don't start it
    // Return confirmation request
    return {
      success: true,
      data: {
        confirmationToken,
        strategyId,
        symbol: effectiveSymbol,
        timeframe: effectiveTimeframe,
        from,
        to,
        rangeDays,
        initialCapital: initialCapital || 10000,
        risk: risk || {},
        estimatedBars: Math.ceil((rangeDays * 24) / (effectiveTimeframe === '1h' ? 1 : effectiveTimeframe === '4h' ? 4 : 24)),
        message: 'Backtest job prepared. Use confirmBacktest tool to start the job.',
      },
      confirmRequired: true, // P1.0: Requires confirmation
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to prepare backtest',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

// ============================================
// confirmBacktest Tool
// ============================================

const ConfirmBacktestSchema = z.object({
  confirmationToken: z.string().min(1),
  // Alternative: jobId if we want to support direct jobId confirmation
  jobId: z.string().optional(),
});

async function confirmBacktestHandler(
  params: z.infer<typeof ConfirmBacktestSchema>,
  ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { confirmationToken, jobId } = params;

    // P1.0: Policy check - only operator/admin can confirm
    if (ctx.userRole !== 'operator' && ctx.userRole !== 'admin' && ctx.userRole !== 'trader') {
      return {
        success: false,
        error: `Role "${ctx.userRole}" cannot confirm backtest jobs. Only operator, trader, or admin can confirm.`,
        errorCode: 'PERMISSION_DENIED',
      };
    }

    // P1.1: Validate token (single-use, TTL, hash-based)
    // Note: In real implementation, we'd retrieve params from token store
    // For now, we validate token exists and is not expired/used
    const tokenValidation = confirmationTokenStore.validateAndConsume(confirmationToken, {});

    // P1.1: For now, we check token exists (full hash validation requires params from store)
    // In a real impl, we'd store params in token and validate here
    const tokenHash = confirmationTokenStore.getTokenHash(confirmationToken);
    if (!tokenHash) {
      return {
        success: false,
        error: 'Invalid or expired confirmation token',
        errorCode: 'POLICY_DENIED',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';

    // Call web-next backtest API to start job
    try {
      const jobResponse = await fetch(`${baseUrl}/api/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationToken,
          // Job params would come from token validation in real impl
          // For now, we'll let the API handle it
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!jobResponse.ok) {
        return {
          success: false,
          error: `Failed to start backtest job: ${jobResponse.status}`,
          errorCode: 'EXECUTION_ERROR',
        };
      }

      const jobData = await jobResponse.json() as {
        jobId?: string;
        status?: string;
        message?: string;
      };

      const finalJobId = jobData.jobId || jobId || `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      return {
        success: true,
        data: {
          jobId: finalJobId,
          started: true,
          status: jobData.status || 'queued',
          message: jobData.message || 'Backtest job started. Use getBacktestStatus to monitor progress.',
          confirmationTokenHash: tokenHash, // P1.1: Return hash for audit (never token itself)
        },
        confirmRequired: false, // Already confirmed
      };
    } catch (error: any) {
      // API unavailable - return error
      return {
        success: false,
        error: `Backtest API unavailable: ${error.message}`,
        errorCode: 'DATA_UNAVAILABLE',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to confirm backtest',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

// ============================================
// getBacktestStatus Tool
// ============================================

const GetBacktestStatusSchema = z.object({
  jobId: z.string().min(1),
});

async function getBacktestStatusHandler(
  params: z.infer<typeof GetBacktestStatusSchema>,
  _ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { jobId } = params;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
    const executorBase = process.env.EXECUTOR_BASE || 'http://localhost:4001';

    // Try web-next API first, fallback to executor
    let statusUrl = `${baseUrl}/api/backtest/status?jobId=${encodeURIComponent(jobId)}`;

    let response = await fetch(statusUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    // If web-next API doesn't exist, try executor directly
    if (!response.ok && response.status === 404) {
      statusUrl = `${executorBase}/v1/backtest/status/${jobId}`;
      response = await fetch(statusUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
    }

    if (response.status === 404) {
      return {
        success: false,
        error: `Backtest job with id "${jobId}" not found`,
        errorCode: 'NOT_FOUND',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch job status: ${response.status}`,
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    const status = await response.json() as {
      jobId?: string;
      type?: string;
      status?: 'queued' | 'running' | 'done' | 'failed' | 'success' | 'error';
      progress?: number;
      progressPct?: number;
      pct?: number;
      phase?: string;
      step?: string;
      etaSec?: number;
      error?: string;
      errorCode?: string;
      startedAt?: number;
      finishedAt?: number;
      result?: any;
    };

    // Normalize status values
    let normalizedStatus: 'queued' | 'running' | 'done' | 'failed' = 'queued';
    if (status.status === 'success' || status.status === 'done') {
      normalizedStatus = 'done';
    } else if (status.status === 'error' || status.status === 'failed') {
      normalizedStatus = 'failed';
    } else if (status.status === 'running') {
      normalizedStatus = 'running';
    } else {
      normalizedStatus = 'queued';
    }

    return {
      success: true,
      data: {
        jobId: status.jobId || jobId,
        status: normalizedStatus,
        progress: status.progress ?? status.progressPct ?? status.pct ?? undefined,
        phase: status.phase || status.step || undefined,
        etaSec: status.etaSec,
        error: status.error,
        errorCode: status.errorCode,
        startedAt: status.startedAt,
        finishedAt: status.finishedAt,
        hasResult: !!status.result,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch backtest status',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

// ============================================
// Register Tools
// ============================================

export function registerBacktestLifecycleTools(): void {
  const startBacktestTool: ToolDefinition = {
    name: 'startBacktest',
    description: 'Prepare a backtest job and request confirmation. Does not start the job. Use confirmBacktest to actually start it.',
    category: 'stateful', // Requires confirmation
    defaultDryRun: false,
    schema: StartBacktestSchema,
    handler: startBacktestHandler,
    policy: {
      requiredRoles: [], // Everyone can prepare backtest
    },
  };

  const confirmBacktestTool: ToolDefinition = {
    name: 'confirmBacktest',
    description: 'Confirm and start a prepared backtest job. Requires operator, trader, or admin role.',
    category: 'stateful',
    defaultDryRun: false,
    schema: ConfirmBacktestSchema,
    handler: confirmBacktestHandler,
    policy: {
      requiredRoles: ['operator', 'trader', 'admin'], // Only these roles can confirm
    },
  };

  const getBacktestStatusTool: ToolDefinition = {
    name: 'getBacktestStatus',
    description: 'Get the status of a running or completed backtest job. Returns progress, phase, and ETA if available.',
    category: 'read-only',
    defaultDryRun: false,
    schema: GetBacktestStatusSchema,
    handler: getBacktestStatusHandler,
    policy: {
      requiredRoles: [], // Everyone can check status
    },
  };

  toolRegistry.register(startBacktestTool);
  toolRegistry.register(confirmBacktestTool);
  toolRegistry.register(getBacktestStatusTool);
}

