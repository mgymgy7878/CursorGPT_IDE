export const dynamic = 'force-dynamic';

/**
 * Market Data Feed Health Endpoint
 * GET /api/marketdata/health
 *
 * Returns real-time market data feed health metrics:
 * - lastMarketTickAt: Timestamp of last market tick (ms)
 * - ageMs: Age of last tick in milliseconds
 * - isStale: Boolean indicating if feed is stale (>15s)
 * - wsConnected: WebSocket connection status
 * - reconnects: Total number of reconnects
 * - rtDelayP95: P95 latency (if available)
 * - source: Data source (mock/binance/btcturk)
 */

interface MarketDataHealth {
  lastMarketTickAt: number | null;
  ageMs: number;
  isStale: boolean;
  wsConnected: boolean;
  reconnects: number;
  rtDelayP95: number | null;
  source: 'mock' | 'binance' | 'btcturk' | 'unknown';
  status: 'healthy' | 'lagging' | 'stale' | 'disconnected';
}

export async function GET() {
  try {
    // Get market store metrics (server-side metrics)
    const { metrics } = await import('@/server/metrics');

    // Get last message timestamp
    const lastMessageTs = metrics.gauges.spark_ws_last_message_ts || 0;
    const now = Date.now();
    const ageMs = lastMessageTs > 0 ? now - lastMessageTs : Infinity;

    // Determine staleness thresholds
    const isStale = ageMs > 15_000; // >15s = stale
    const isLagging = ageMs > 3_000 && ageMs <= 15_000; // 3-15s = lagging

    // Determine status
    let status: 'healthy' | 'lagging' | 'stale' | 'disconnected';
    if (lastMessageTs === 0 || ageMs === Infinity) {
      status = 'disconnected';
    } else if (isStale) {
      status = 'stale';
    } else if (isLagging) {
      status = 'lagging';
    } else {
      status = 'healthy';
    }

    // Check WS connection status (from market store if available)
    // For now, assume connected if we have recent messages
    const wsConnected = lastMessageTs > 0 && ageMs < 60_000; // Consider connected if message within last minute

    // Get reconnect count
    const reconnects = metrics.counters.spark_ws_reconnects_total || 0;

    // Determine source (check environment or metrics)
    const wsMode = process.env.NEXT_PUBLIC_WS_MOCK === '1' || process.env.WS_MODE === 'mock' ? 'mock' : 'btcturk';
    const source: 'mock' | 'binance' | 'btcturk' | 'unknown' = wsMode === 'mock' ? 'mock' : 'btcturk';

    // RT Delay P95 (if available from healthz endpoint)
    let rtDelayP95: number | null = null;
    try {
      const healthzUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3003';
      const healthzRes = await fetch(`${healthzUrl}/api/healthz?mode=ui`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(1000),
      });
      if (healthzRes.ok) {
        const healthzData = await healthzRes.json();
        rtDelayP95 = healthzData.slo?.latencyP95 ?? null;
      }
    } catch {
      // Ignore errors, keep null
    }

    const health: MarketDataHealth = {
      lastMarketTickAt: lastMessageTs > 0 ? lastMessageTs : null,
      ageMs: ageMs === Infinity ? 0 : ageMs,
      isStale,
      wsConnected,
      reconnects,
      rtDelayP95,
      source,
      status,
    };

    return Response.json(health, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    // Degrade gracefully: return disconnected state
    const health: MarketDataHealth = {
      lastMarketTickAt: null,
      ageMs: 0,
      isStale: true,
      wsConnected: false,
      reconnects: 0,
      rtDelayP95: null,
      source: 'unknown',
      status: 'disconnected',
    };

    return Response.json(health, {
      status: 200, // Always return 200 for UI polling
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}
