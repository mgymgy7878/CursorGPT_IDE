export const runtime = "nodejs";

// Simple in-memory cache
const cache = new Map<string, { ts: number; data: any }>();

function getCache(key: string, ttl = 15000) {
  const v = cache.get(key);
  return (v && Date.now() - v.ts < ttl) ? v.data : null;
}

function setCache(key: string, data: any) {
  cache.set(key, { ts: Date.now(), data });
}

// Binance API fetcher
async function fetchBinanceKlines(symbol: string, interval: string, limit: number) {
  const base = "https://api.binance.com";
  const url = `${base}/api/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`binance_api_error ${res.status}`);
  
  const arr = await res.json();
  return (arr || []).map((x: any) => ({
    t: x[0],       // timestamp
    o: +x[1],      // open
    h: +x[2],      // high
    l: +x[3],      // low
    c: +x[4],      // close
    v: +x[5]       // volume
  }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const timeframe = searchParams.get('timeframe') || '1h';
    const limit = parseInt(searchParams.get('limit') || '200');

    // Cache key
    const key = `candles|${symbol}|${timeframe}|${limit}`;
    const hit = getCache(key);
    if (hit) {
      return new Response(JSON.stringify(hit), {
        status: 200,
        headers: { 
          'content-type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }

    // Fetch from Binance
    const candles = await fetchBinanceKlines(symbol, timeframe, limit);
    
    // Cache result
    setCache(key, candles);

    return new Response(JSON.stringify(candles), {
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'X-Cache': 'MISS'
      }
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || 'candles_fetch_error' }),
      { 
        status: 500, 
        headers: { 'content-type': 'application/json' }
      }
    );
  }
}

