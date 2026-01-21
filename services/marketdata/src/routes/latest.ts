import { FastifyInstance, FastifyRequest } from "fastify";

type LatestQuery = {
  symbol?: string;
  timeframe?: string;
};

// In-memory cache for latest candle (Binance SSE'den geliyor)
const latestCache = new Map<string, { ts: number; open: number; high: number; low: number; close: number; volume: number }>();

export default async function latestRoute(app: FastifyInstance) {
  // Update cache endpoint (internal, SSE'den çağrılacak)
  app.post("/api/marketdata/latest/update", async (req: FastifyRequest<{ Body: { symbol: string; timeframe: string; ts: number; o: number; h: number; l: number; c: number; v: number } }>) => {
    const { symbol, timeframe, ts, o, h, l, c, v } = req.body;
    const key = `${symbol}:${timeframe}`;
    latestCache.set(key, { ts, open: o, high: h, low: l, close: c, volume: v });
    return { ok: true };
  });

  // Get latest candle
  app.get("/api/marketdata/latest", async (req: FastifyRequest<{ Querystring: LatestQuery }>) => {
    const symbol = (req.query.symbol || "BTCUSDT").toUpperCase();
    const timeframe = req.query.timeframe || "1m";
    const key = `${symbol}:${timeframe}`;
    const serverNow = Date.now();

    const cached = latestCache.get(key);
    if (cached) {
      const ageSec = Math.floor((serverNow - cached.ts) / 1000);
      return {
        ...cached,
        serverNow,
        candleTs: cached.ts,
        ageSec,
      };
    }

    // Fallback: Binance REST API'den son candle çek (her zaman fresh)
    try {
      const interval = timeframe;
      // Use limit=2 and endTime=now to get the most recent closed candle
      const endTime = serverNow;
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=2&endTime=${endTime}`);
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
        };
        // Always update cache (fresh data)
        latestCache.set(key, candle);
        const ageSec = Math.floor((serverNow - candle.ts) / 1000);
        return {
          ...candle,
          serverNow,
          candleTs: candle.ts,
          ageSec,
        };
      }
    } catch (err) {
      app.log.error(err);
    }

    return { error: "No data available", serverNow };
  });
}
