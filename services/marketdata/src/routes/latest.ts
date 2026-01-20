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
    
    const cached = latestCache.get(key);
    if (cached) {
      return cached;
    }

    // Fallback: Binance REST API'den son candle çek
    try {
      const interval = timeframe;
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const k = data[0];
        const candle = {
          ts: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        };
        latestCache.set(key, candle);
        return candle;
      }
    } catch (err) {
      app.log.error(err);
    }

    return { error: "No data available" };
  });
}
