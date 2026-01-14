export const dynamic = 'force-dynamic';

/**
 * Live Market Candles API - Canlı piyasa verisi
 * GET /api/live/market/candles?symbol=BTCUSDT&tf=1h&limit=500
 *
 * Primary: Executor/Feed'den çeker
 * Fallback: Binance API (mevcut /api/marketdata/candles mantığı)
 */

const EXECUTOR_URL = process.env.EXECUTOR_URL || process.env.NEXT_PUBLIC_EXECUTOR_URL || 'http://127.0.0.1:4001';
const FEED_URL = process.env.FEED_URL || process.env.NEXT_PUBLIC_FEED_URL || EXECUTOR_URL;

interface Candle {
  t: number; // timestamp (ms)
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

async function fetchFromFeed(symbol: string, tf: string, limit: number): Promise<Candle[] | null> {
  try {
    // Executor/Feed'de market data endpoint'i varsa kullan
    // Örnek: /api/market/candles veya /feed/candles
    const res = await fetch(`${FEED_URL}/api/market/candles?symbol=${symbol}&timeframe=${tf}&limit=${limit}`, {
      signal: AbortSignal.timeout(3000),
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return data.candles || data || null;
    }
  } catch {
    // Feed erişilemiyor, fallback'e geç
  }
  return null;
}

async function fetchFromBinance(symbol: string, tf: string, limit: number): Promise<Candle[]> {
  const base = "https://api.binance.com";
  const url = `${base}/api/v1/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`binance_api_error ${res.status}`);
  }

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

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const tf = searchParams.get('tf') || searchParams.get('timeframe') || '1h';
    const limit = parseInt(searchParams.get('limit') || '500');

    // Primary: Feed'den çek
    const feedCandles = await fetchFromFeed(symbol, tf, limit);
    if (feedCandles && feedCandles.length > 0) {
      return Response.json({
        candles: feedCandles,
        source: 'feed',
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // Fallback: Binance API
    const candles = await fetchFromBinance(symbol, tf, limit);
    return Response.json({
      candles,
      source: 'binance',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    // Hata durumunda 503 + fallback işareti
    return Response.json(
      {
        error: error?.message || 'candles_fetch_error',
        fallback: 'mock',
        candles: [],
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
