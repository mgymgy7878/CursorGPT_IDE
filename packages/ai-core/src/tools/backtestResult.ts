/**
 * getBacktestResult Tool (P1.1)
 *
 * Retrieves backtest job result with 32KB-safe preview.
 * Returns metrics, equity curve preview (max 200 points), trades preview (max 50).
 */

import { z } from 'zod';
import { createHash } from 'crypto';
import type { ToolDefinition, ToolContext, ToolResult } from './types.js';
import { toolRegistry } from './registry.js';

/**
 * Stable stringify with recursive key sorting (deterministic JSON for hashing)
 *
 * P1.1 Hardening: Handles Date, BigInt, undefined, and float normalization
 * P1.2 Security: Circular reference detection to prevent stack overflow
 */
function stableStringify(obj: any): string {
  const seen = new WeakSet(); // Track visited objects for circular detection

  function stringify(value: any): string {
    if (value === null) {
      return 'null';
    }

    if (value === undefined) {
      return 'undefined'; // Explicit handling (JSON.stringify omits undefined)
    }

    // Date: normalize to ISO string
    if (value instanceof Date) {
      return JSON.stringify(value.toISOString());
    }

    // BigInt: convert to string
    if (typeof value === 'bigint') {
      return JSON.stringify(value.toString());
    }

    if (typeof value !== 'object') {
      // Number: normalize floats to prevent precision drift (P1.2: can add toFixed(8) if needed)
      if (typeof value === 'number' && !Number.isInteger(value)) {
        // For now, use JSON.stringify (P1.2: can add precision normalization)
        return JSON.stringify(value);
      }
      return JSON.stringify(value);
    }

    // P1.2 Security: Circular reference detection
    if (seen.has(value)) {
      return '"[Circular]"'; // Sentinel for circular references
    }
    seen.add(value);

    try {
      if (Array.isArray(value)) {
        const result = `[${value.map(item => stringify(item)).join(',')}]`;
        seen.delete(value); // Clean up after processing
        return result;
      }

      // Object: sort keys recursively
      const sortedKeys = Object.keys(value).sort();
      const entries = sortedKeys.map(key => {
        const item = value[key];
        // Skip undefined values (consistent with JSON.stringify behavior)
        if (item === undefined) {
          return null; // Will be filtered
        }
        const itemStr = typeof item === 'object' && item !== null
          ? stringify(item)
          : JSON.stringify(item);
        return `${JSON.stringify(key)}:${itemStr}`;
      }).filter(entry => entry !== null);

      seen.delete(value); // Clean up after processing
      return `{${entries.join(',')}}`;
    } catch (error) {
      seen.delete(value); // Ensure cleanup on error
      // P1.2 Security: If stringify fails, return error sentinel
      return `"[StringifyError: ${error instanceof Error ? error.message : 'unknown'}]"`;
    }
  }

  return stringify(obj);
}

const GetBacktestResultSchema = z.object({
  jobId: z.string().min(1),
});

/**
 * Truncate array to fit byte budget (P1.1 Hardening: real byte measurement)
 *
 * Uses Buffer.byteLength for accurate UTF-8 byte counting (not character count).
 */
function truncateToByteBudget<T extends Record<string, any>>(
  items: T[],
  maxBytes: number,
  itemSizeEstimate: (item: T) => number
): { items: T[]; truncated: boolean; actualBytes: number } {
  let totalBytes = 0;
  const result: T[] = [];

  for (const item of items) {
    // Estimate first (fast path)
    const estimatedBytes = itemSizeEstimate(item);
    if (totalBytes + estimatedBytes > maxBytes) {
      // Verify with actual measurement before truncating
      const testResult = [...result, item];
      const testJson = JSON.stringify(testResult);
      const actualBytes = Buffer.byteLength(testJson, 'utf8');
      if (actualBytes > maxBytes) {
        return { items: result, truncated: true, actualBytes: totalBytes, reason };
      }
      // If estimate was wrong but actual fits, continue
    }
    result.push(item);
    totalBytes += estimatedBytes;
  }

  // Final verification with actual measurement
      const finalJson = JSON.stringify(result);
      const actualBytes = Buffer.byteLength(finalJson, 'utf8');
      if (actualBytes > maxBytes) {
        // Need to truncate more aggressively
        let truncated = result;
        while (truncated.length > 0) {
          truncated = truncated.slice(0, -1);
          const testJson = JSON.stringify(truncated);
          if (Buffer.byteLength(testJson, 'utf8') <= maxBytes) {
            return { items: truncated, truncated: true, actualBytes: Buffer.byteLength(testJson, 'utf8'), reason };
          }
        }
        return { items: [], truncated: true, actualBytes: 0, reason };
      }

  return { items: result, truncated: false, actualBytes };
}

async function getBacktestResultHandler(
  params: z.infer<typeof GetBacktestResultSchema>,
  _ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { jobId } = params;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';

    // First check job status
    const statusUrl = `${baseUrl}/api/backtest/status?jobId=${encodeURIComponent(jobId)}`;
    const statusResponse = await fetch(statusUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (statusResponse.status === 404) {
      return {
        success: false,
        error: `Backtest job with id "${jobId}" not found`,
        errorCode: 'NOT_FOUND',
      };
    }

    if (!statusResponse.ok) {
      return {
        success: false,
        error: `Failed to fetch job status: ${statusResponse.status}`,
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    const status = await statusResponse.json() as {
      jobId?: string;
      status?: 'queued' | 'running' | 'done' | 'failed' | 'success' | 'error';
      result?: any;
      error?: string;
    };

    // P1.1: Check if job is ready
    const normalizedStatus = status.status === 'success' || status.status === 'done'
      ? 'done'
      : status.status === 'error' || status.status === 'failed'
      ? 'failed'
      : status.status === 'running'
      ? 'running'
      : 'queued';

    if (normalizedStatus !== 'done' && normalizedStatus !== 'failed') {
      return {
        success: false,
        error: `Backtest job is ${normalizedStatus}. Result not available yet.`,
        errorCode: 'NOT_READY',
      };
    }

    if (normalizedStatus === 'failed') {
      return {
        success: false,
        error: status.error || 'Backtest job failed',
        errorCode: 'EXECUTION_ERROR',
      };
    }

    // Job is done, fetch result
    const result = status.result || {};

    // Extract metrics
    const metrics = {
      cagr: result.cagr ?? result.totalReturn ?? 0,
      maxDrawdown: result.maxDrawdown ?? result.maxDD ?? 0,
      winRate: result.winRate ?? 0,
      profitFactor: result.profitFactor ?? 0,
      tradeCount: result.tradeCount ?? result.trades?.length ?? 0,
      totalReturn: result.totalReturn ?? 0,
      sharpeRatio: result.sharpeRatio ?? result.sharpe ?? 0,
    };

    // Extract equity curve (max 200 points, ~10KB budget)
    // P1.1 Hardening: Real byte measurement with Buffer.byteLength
    const equityCurve = result.equityCurve || [];
    const { items: equityCurvePreview, truncated: equityTruncated, actualBytes: equityBytes, reason: equityReason } = truncateToByteBudget(
      equityCurve.slice(0, 200), // Limit to 200 points first
      10 * 1024, // 10KB for equity curve
      (item) => Buffer.byteLength(JSON.stringify(item), 'utf8'),
      'equity'
    );

    // Extract trades (max 50, ~14KB budget)
    const trades = result.trades || [];
    const { items: tradesPreview, truncated: tradesTruncated, actualBytes: tradesBytes, reason: tradesReason } = truncateToByteBudget(
      trades.slice(0, 50), // Limit to 50 trades first
      14 * 1024, // 14KB for trades
      (item) => Buffer.byteLength(JSON.stringify(item), 'utf8'),
      'trades'
    );

    // Calculate full result hash (for verification) - use stable stringify for determinism
    const fullResultStr = stableStringify(result);
    const resultHash = createHash('sha256').update(fullResultStr, 'utf8').digest('hex');

    // Calculate preview size with real byte measurement
    const previewData = {
      metrics,
      equityCurvePreview: equityCurvePreview.length > 0 ? equityCurvePreview : undefined,
      tradesPreview: tradesPreview.length > 0 ? tradesPreview : undefined,
    };
    const previewStr = JSON.stringify(previewData);
    const resultPreviewBytes = Buffer.byteLength(previewStr, 'utf8');

    // Check if truncated (budget: 24KB for previews, 8KB for header+metrics)
    const truncated = equityTruncated || tradesTruncated || resultPreviewBytes > 30 * 1024;

    // Determine truncation reason (P1.1 Hardening: UX clarity)
    let truncationReason: 'trades' | 'equity' | 'metrics' | undefined = undefined;
    if (truncated) {
      if (tradesTruncated) {
        truncationReason = 'trades';
      } else if (equityTruncated) {
        truncationReason = 'equity';
      } else if (resultPreviewBytes > 30 * 1024) {
        truncationReason = 'metrics'; // Header+metrics too large
      }
    }

    return {
      success: true,
      data: {
        jobId,
        status: 'done',
        metrics,
        equityCurvePreview: equityCurvePreview.length > 0 ? equityCurvePreview : undefined,
        tradesPreview: tradesPreview.length > 0 ? tradesPreview : undefined,
        resultHash,
        resultPreviewBytes,
        truncated,
        truncationReason, // P1.1 Hardening: UX clarity
        equityCurvePoints: equityCurve.length,
        equityCurvePreviewPoints: equityCurvePreview.length,
        tradesTotal: trades.length,
        tradesPreviewCount: tradesPreview.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch backtest result',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

/**
 * Register getBacktestResult tool
 */
export function registerBacktestResultTool(): void {
  const tool: ToolDefinition = {
    name: 'getBacktestResult',
    description: 'Get backtest job result with 32KB-safe preview. Returns metrics, equity curve preview (max 200 points), and trades preview (max 50). Use getBacktestStatus to check if job is done first.',
    category: 'read-only',
    defaultDryRun: false,
    schema: GetBacktestResultSchema,
    handler: getBacktestResultHandler,
    policy: {
      requiredRoles: [], // Everyone can view results
    },
  };

  toolRegistry.register(tool);
}


