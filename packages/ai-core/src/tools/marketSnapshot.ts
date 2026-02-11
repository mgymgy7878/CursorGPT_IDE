/**
 * getMarketSnapshot Tool
 *
 * Retrieves market snapshot data (price, candles, indicators) for a symbol/timeframe.
 * This is the second real tool implementation (read-only, demonstrates product value).
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from './types.js';
import { toolRegistry } from './registry.js';

const MarketSnapshotSchema = z.object({
  symbol: z.string().min(1).max(20), // e.g., "BTCUSDT", "ETHUSDT"
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  indicators: z.array(z.string()).optional(), // e.g., ["sma", "ema", "rsi"]
  candleLimit: z.number().int().min(1).max(300).optional().default(120), // Default 120, max 300 (32KB limit protection)
});

/**
 * Get timeframe duration in seconds
 */
function getTimeframeSeconds(timeframe: string): number {
  const map: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };
  return map[timeframe] || 3600;
}

async function getMarketSnapshotHandler(
  params: z.infer<typeof MarketSnapshotSchema>,
  _ctx: ToolContext
): Promise<ToolResult> {
  try {
    const { symbol, timeframe, indicators = [], candleLimit = 120 } = params;

    // HARDENING: Enforce 32KB limit protection
    // 300 candles * ~100 bytes/candle = ~30KB (safe margin)
    const safeLimit = Math.min(candleLimit, 300);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
    const candlesUrl = `${baseUrl}/api/marketdata/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${safeLimit}`;

    // P0.6: Fetch 24h metrics from ticker endpoint (more accurate than candles)
    // For Binance, we can use the ticker/24hr endpoint directly
    const ticker24hUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`;
    let metricsSource: 'ticker24h' | 'candles_approx' = 'ticker24h';
    let change24h = 0;
    let volume24h = 0;
    let currentPrice = 0;

    try {
      const tickerResponse = await fetch(ticker24hUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });

      if (tickerResponse.ok) {
        const ticker = await tickerResponse.json() as {
          lastPrice?: string;
          priceChangePercent?: string;
          volume?: string;
          // Binance API format
          priceChange?: string;
          quoteVolume?: string;
        };
        // Binance returns lastPrice or priceChangePercent
        currentPrice = ticker.lastPrice ? parseFloat(ticker.lastPrice) : 0;
        change24h = ticker.priceChangePercent ? parseFloat(ticker.priceChangePercent) : 0;
        volume24h = ticker.volume ? parseFloat(ticker.volume) : (ticker.quoteVolume ? parseFloat(ticker.quoteVolume) : 0);
        if (currentPrice > 0) {
          metricsSource = 'ticker24h';
        } else {
          metricsSource = 'candles_approx';
        }
      } else {
        // Fallback: calculate from candles (approximate)
        metricsSource = 'candles_approx';
      }
    } catch {
      // Fallback: calculate from candles (approximate)
      metricsSource = 'candles_approx';
    }

    // Fetch candles
    const candlesResponse = await fetch(candlesUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!candlesResponse.ok) {
      return {
        success: false,
        error: `Failed to fetch candles: ${candlesResponse.status}`,
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    const candles = await candlesResponse.json() as Array<{
      t: number;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
    }>;

    if (!Array.isArray(candles) || candles.length === 0) {
      return {
        success: false,
        error: 'No candle data available',
        errorCode: 'DATA_UNAVAILABLE',
      };
    }

    // If ticker failed, calculate from candles (approximate)
    if (metricsSource === 'candles_approx') {
      const latestCandle = candles[0];
      currentPrice = latestCandle.c;
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Find 24h ago candle (approximate)
      const candles24hAgo = candles.filter(c => c.t <= oneDayAgo);
      const price24hAgo = candles24hAgo.length > 0
        ? candles24hAgo[candles24hAgo.length - 1].c
        : candles[candles.length - 1].c;

      change24h = price24hAgo > 0
        ? ((currentPrice - price24hAgo) / price24hAgo) * 100
        : 0;

      // Calculate 24h volume (sum of volumes in last 24h)
      volume24h = candles
        .filter(c => c.t >= oneDayAgo)
        .reduce((sum, c) => sum + c.v, 0);
    }

    // P0.6: Timeframe-aware staleness calculation
    const timeframeSeconds = getTimeframeSeconds(timeframe);
    const lastUpdate = candles[0].t;
    const now = Date.now();
    const stalenessMs = now - lastUpdate;
    const stalenessSec = Math.floor(stalenessMs / 1000);

    // ok <= 2 * timeframeSeconds, warn <= 5 * timeframeSeconds, else stale
    let staleness: 'ok' | 'warn' | 'stale' = 'ok';
    if (stalenessSec > 5 * timeframeSeconds) {
      staleness = 'stale';
    } else if (stalenessSec > 2 * timeframeSeconds) {
      staleness = 'warn';
    }

    // Build result
    const result: {
      symbol: string;
      timeframe: string;
      currentPrice: number;
      change24h: number;
      volume24h: number;
      lastUpdate: number;
      staleness: 'ok' | 'warn' | 'stale';
      stalenessSeconds: number;
      metricsSource: 'ticker24h' | 'candles_approx';
      candles: Array<{
        t: number;
        o: number;
        h: number;
        l: number;
        c: number;
        v: number;
      }>;
      indicators?: Record<string, any>;
    } = {
      symbol,
      timeframe,
      currentPrice: Number(currentPrice.toFixed(2)),
      change24h: Number(change24h.toFixed(2)),
      volume24h: Number(volume24h.toFixed(2)),
      lastUpdate,
      staleness,
      stalenessSeconds: stalenessSec,
      metricsSource,
      candles: candles.slice(0, safeLimit), // Ensure limit
    };

    // TODO: Calculate indicators if requested (P1)
    // For now, return empty indicators object if requested
    if (indicators.length > 0) {
      result.indicators = {};
      // Placeholder: indicators calculation would go here
      // For P0, we just return the structure
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch market snapshot',
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

/**
 * Register getMarketSnapshot tool
 */
export function registerMarketSnapshotTool(): void {
  const tool: ToolDefinition = {
    name: 'getMarketSnapshot',
    description: 'Get market snapshot data (price, candles, indicators) for a symbol and timeframe',
    category: 'read-only',
    defaultDryRun: false, // Read-only, no dry-run needed
    schema: MarketSnapshotSchema,
    handler: getMarketSnapshotHandler,
    policy: {
      requiredRoles: [], // Everyone can check market data
    },
  };

  toolRegistry.register(tool);
}

