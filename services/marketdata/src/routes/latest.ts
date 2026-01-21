import { FastifyInstance, FastifyRequest } from "fastify";

type LatestQuery = {
  symbol?: string;
  timeframe?: string;
};

// In-memory cache for latest candle (Binance SSE'den geliyor)
const latestCache = new Map<string, { ts: number; open: number; high: number; low: number; close: number; volume: number; fetchedAt: number }>();

// In-flight fetch dedupe: key -> Promise
const inFlightFetches = new Map<string, Promise<any>>();

// Timeframe to interval seconds mapping
function timeframeToIntervalSec(timeframe: string): number {
  const map: Record<string, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
    "1w": 604800,
    "1M": 2592000,
  };
  return map[timeframe.toLowerCase()] || 60;
}

export default async function latestRoute(app: FastifyInstance) {
  // Update cache endpoint (internal, SSE'den çağrılacak)
  app.post("/api/marketdata/latest/update", async (req: FastifyRequest<{ Body: { symbol: string; timeframe: string; ts: number; o: number; h: number; l: number; c: number; v: number } }>) => {
    const { symbol, timeframe, ts, o, h, l, c, v } = req.body;
    const key = `${symbol}:${timeframe}`;
    latestCache.set(key, { ts, open: o, high: h, low: l, close: c, volume: v, fetchedAt: Date.now() });
    return { ok: true };
  });

  // Get latest candle
  app.get("/api/marketdata/latest", async (req: FastifyRequest<{ Querystring: LatestQuery }>) => {
    const symbol = (req.query.symbol || "BTCUSDT").toUpperCase();
    const timeframe = req.query.timeframe || "1m";
    const key = `${symbol}:${timeframe}`;
    const serverNow = Date.now();
    const intervalSec = timeframeToIntervalSec(timeframe);
    const maxAgeSec = intervalSec * 2 + 5; // e.g., 1m => 125s

    // Check cache
    const cached = latestCache.get(key);
    if (cached) {
      const ageSec = Math.floor((serverNow - cached.ts) / 1000);
      
      // If cache is fresh enough, return it
      if (ageSec <= maxAgeSec) {
        return {
          ...cached,
          serverNow,
          candleTs: cached.ts,
          ageSec,
          source: "cache",
          fetchedAt: cached.fetchedAt || serverNow,
          stale: false,
        };
      }
      // Cache is stale, will force fetch below
    }

    // Force fetch from Binance (cache stale or missing)
    // In-flight dedupe: if already fetching, await same promise
    if (inFlightFetches.has(key)) {
      try {
        const result = await inFlightFetches.get(key);
        return result;
      } catch (err) {
        // Fetch failed, fall through to retry or return stale cache
      }
    }

    // Start new fetch
    const fetchPromise = (async () => {
      try {
        const interval = timeframe;
        const endTime = serverNow;
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=2&endTime=${endTime}`);
        
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Get the last (most recent) candle
          const k = data[data.length - 1];
          const candle = {
            ts: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            fetchedAt: serverNow,
          };
          // Update cache
          latestCache.set(key, candle);
          const ageSec = Math.floor((serverNow - candle.ts) / 1000);
          
          inFlightFetches.delete(key);
          return {
            ...candle,
            serverNow,
            candleTs: candle.ts,
            ageSec,
            source: "binance_rest",
            fetchedAt: candle.fetchedAt,
            stale: ageSec > maxAgeSec,
          };
        }
        throw new Error("Empty response from Binance");
      } catch (err: any) {
        inFlightFetches.delete(key);
        
        // If fetch fails and cache exists, return stale cache with error flag
        if (cached) {
          const ageSec = Math.floor((serverNow - cached.ts) / 1000);
          return {
            ...cached,
            serverNow,
            candleTs: cached.ts,
            ageSec,
            source: "cache_fallback_error",
            fetchedAt: cached.fetchedAt || serverNow,
            stale: true,
            error: {
              message: String(err?.message || err),
              code: err?.code || "FETCH_FAILED",
            },
          };
        }
        
        // No cache, return error
        throw err;
      }
    })();

    inFlightFetches.set(key, fetchPromise);

    try {
      return await fetchPromise;
    } catch (err: any) {
      return {
        error: "No data available",
        serverNow,
        source: "error",
        stale: true,
        error: {
          message: String(err?.message || err),
          code: err?.code || "UNKNOWN",
        },
      };
    }
  });
}
