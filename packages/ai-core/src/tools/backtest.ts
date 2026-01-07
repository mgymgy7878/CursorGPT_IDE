/**
 * runBacktest Tool
 *
 * Runs a backtest in dry-run mode (P0.8).
 * Validates parameters, checks data availability, estimates cost.
 * Never starts actual job in P0 (commit mode is P1 feature).
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from './types.js';
import { toolRegistry } from './registry.js';

const RunBacktestSchema = z.object({
  strategyId: z.string().min(1),
  symbol: z.string().optional(), // Override strategy symbol
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).optional(),
  from: z.string(), // ISO date string
  to: z.string(), // ISO date string
  initialCapital: z.number().positive().optional(),
  risk: z.object({
    maxDrawdownPct: z.number().min(0).max(100).optional(),
    maxPositionPct: z.number().min(0).max(100).optional(),
  }).optional(),
  mode: z.enum(['dryRun', 'commit']).optional().default('dryRun'),
});

/**
 * Calculate days between two ISO date strings
 */
function daysBetween(from: string, to: string): number {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Estimate number of bars for a timeframe and date range
 */
function estimateBars(timeframe: string, days: number): number {
  const barsPerDay: Record<string, number> = {
    '1m': 24 * 60,
    '5m': 24 * 12,
    '15m': 24 * 4,
    '1h': 24,
    '4h': 6,
    '1d': 1,
  };
  const barsPerDayCount = barsPerDay[timeframe] || 24;
  return Math.ceil(barsPerDayCount * days);
}

/**
 * Estimate cost based on bars and timeframe
 */
function estimateCost(bars: number, timeframe: string): 'low' | 'med' | 'high' {
  // High-frequency timeframes (1m, 5m) are more expensive
  const isHighFreq = timeframe === '1m' || timeframe === '5m';

  if (bars < 1000) return 'low';
  if (bars < 10000) return isHighFreq ? 'high' : 'med';
  return 'high';
}

async function runBacktestHandler(
  params: z.infer<typeof RunBacktestSchema>,
  ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { strategyId, symbol, timeframe, from, to, initialCapital, risk, mode = 'dryRun' } = params;

    // P0.8: Policy check - commit mode denied for readonly
    if (mode === 'commit' && ctx.userRole === 'readonly') {
      return {
        success: false,
        error: 'Commit mode is not allowed for readonly role. Use dryRun mode.',
        errorCode: 'POLICY_DENIED',
      };
    }

    // P0.8: Date range validation (max 365 days)
    const rangeDays = daysBetween(from, to);
    if (rangeDays < 1) {
      return {
        success: false,
        error: 'Invalid date range: "to" must be after "from"',
        errorCode: 'INVALID_PARAMS',
      };
    }
    if (rangeDays > 365) {
      return {
        success: false,
        error: `Date range too large: ${rangeDays} days (max 365 days)`,
        errorCode: 'INVALID_PARAMS',
      };
    }

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

    // Use provided params or fallback to strategy defaults
    const effectiveSymbol = symbol || strategy.symbol || 'BTCUSDT';
    const effectiveTimeframe = timeframe || strategy.timeframe || '1h';

    // Check data availability (sample check - fetch first candle)
    const candlesUrl = `${baseUrl}/api/marketdata/candles?symbol=${encodeURIComponent(effectiveSymbol)}&timeframe=${effectiveTimeframe}&limit=1`;

    let dataAvailable = false;
    let warnings: string[] = [];

    try {
      const candlesResponse = await fetch(candlesUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });

      if (candlesResponse.ok) {
        const candles = await candlesResponse.json() as Array<{ t: number }>;
        if (Array.isArray(candles) && candles.length > 0) {
          dataAvailable = true;

          // Check if date range is reasonable (data exists in range)
          const latestCandleTime = candles[0].t;
          const fromTime = new Date(from).getTime();
          const toTime = new Date(to).getTime();

          if (latestCandleTime < fromTime) {
            warnings.push(`Latest available data (${new Date(latestCandleTime).toISOString()}) is before start date`);
          }
        } else {
          warnings.push('No candle data available for symbol/timeframe');
        }
      } else {
        warnings.push(`Market data endpoint returned ${candlesResponse.status}`);
      }
    } catch (error: any) {
      warnings.push(`Market data check failed: ${error.message}`);
    }

    if (!dataAvailable) {
      return {
        success: false,
        error: 'Market data not available for the specified symbol/timeframe',
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    // Estimate bars
    const estimatedBars = estimateBars(effectiveTimeframe, rangeDays);
    const estimatedCost = estimateCost(estimatedBars, effectiveTimeframe);

    // P1.0: Estimate payload size (for 32KB limit monitoring)
    // Rough estimate: each bar ~100 bytes, equity curve point ~50 bytes, trade ~200 bytes
    const estimatedCandles = estimatedBars;
    const estimatedEquityPoints = Math.min(estimatedBars, 200); // Max 200 points for preview
    const estimatedTrades = Math.min(Math.floor(estimatedBars / 10), 50); // Rough estimate: 1 trade per 10 bars, max 50

    const estimatedPayloadBytes =
      (estimatedCandles * 100) + // Candles
      (estimatedEquityPoints * 50) + // Equity curve
      (estimatedTrades * 200) + // Trades
      2000; // Metadata overhead

    // Determine limit reason if applicable
    let limitReason: 'rangeDays' | 'timeframe' | 'cap' | undefined;
    if (rangeDays >= 300) {
      limitReason = 'rangeDays';
    } else if (effectiveTimeframe === '1m' || effectiveTimeframe === '5m') {
      limitReason = 'timeframe';
    } else if (estimatedPayloadBytes > 30000) {
      limitReason = 'cap';
    }

    // P0.8: Dry-run only - never start actual job
    // In P1, commit mode would create a job here
    const jobId = mode === 'dryRun'
      ? `dryrun_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      : null; // Commit mode not allowed in P0

    if (mode === 'commit') {
      return {
        success: false,
        error: 'Commit mode is not available in P0.8. Use startBacktest tool for P1.0.',
        errorCode: 'POLICY_DENIED',
      };
    }

    return {
      success: true,
      data: {
        jobId,
        dryRun: true,
        estimatedBars,
        estimatedCandles,
        estimatedPayloadBytes,
        estimatedCost,
        rangeDays,
        symbol: effectiveSymbol,
        timeframe: effectiveTimeframe,
        limitReason,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      confirmRequired: false, // Dry-run never requires confirmation
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to run backtest',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

/**
 * Register runBacktest tool
 */
export function registerBacktestTool(): void {
  const tool: ToolDefinition = {
    name: 'runBacktest',
    description: 'Run a backtest in dry-run mode. Validates parameters, checks data availability, and estimates cost. Never starts actual job in P0 (commit mode is P1 feature).',
    category: 'read-only', // P0.8: dry-run is read-only
    defaultDryRun: true,
    schema: RunBacktestSchema,
    handler: runBacktestHandler,
    policy: {
      requiredRoles: [], // Everyone can run dry-run backtests
    },
  };

  toolRegistry.register(tool);
}

