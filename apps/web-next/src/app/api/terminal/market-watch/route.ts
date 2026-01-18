import { NextResponse } from 'next/server';
import type { TickerRow } from '@/lib/terminal/contracts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const symbols = [
  { symbol: 'BTCUSDT', quote: 'USDT' },
  { symbol: 'ETHUSDT', quote: 'USDT' },
  { symbol: 'SOLUSDT', quote: 'USDT' },
  { symbol: 'XRPUSDT', quote: 'USDT' },
  { symbol: 'ADAUSDT', quote: 'USDT' },
  { symbol: 'BNBUSDT', quote: 'USDT' },
  { symbol: 'AVAXUSDT', quote: 'USDT' },
  { symbol: 'DOTUSDT', quote: 'USDT' },
  { symbol: 'LINKUSDT', quote: 'USDT' },
  { symbol: 'MATICUSDT', quote: 'USDT' },
];

const seedRows: TickerRow[] = symbols.map((s, idx) => ({
  symbol: s.symbol,
  last: [42156.2, 2250.15, 98.4, 0.56, 0.52, 325.4, 36.8, 7.4, 14.2, 0.88][idx] ?? 1,
  change24hPct: [0.0124, -0.0045, 0.0512, -0.011, 0.0015, 0.006, 0.024, -0.0215, 0.009, -0.003][idx] ?? 0,
  quote: s.quote as 'USDT',
  isFav: false,
}));

async function fetchBinanceTicker(symbol: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const price = parseFloat(data.lastPrice || '0');
    const change = parseFloat(data.priceChangePercent || '0');
    if (!Number.isFinite(price)) return null;
    return { price, change24h: change / 100 };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceSeed = searchParams.get('seed') === '1';

  if (forceSeed) {
    return NextResponse.json({ dataQuality: 'seed', tickers: seedRows, _meta: { source: 'seed' } });
  }

  const results = await Promise.all(
    symbols.map(async (s) => {
      const live = await fetchBinanceTicker(s.symbol);
      return {
        symbol: s.symbol,
        last: live?.price ?? null,
        change24hPct: live?.change24h ?? null,
        quote: s.quote as 'USDT',
        isFav: false,
        live: !!live,
      };
    })
  );

  const hasLive = results.some((r) => r.live);
  const tickers: TickerRow[] = results.map(({ live, ...row }) => row);

  return NextResponse.json({
    dataQuality: hasLive ? 'live' : 'seed',
    tickers: hasLive ? tickers : seedRows,
    _meta: { source: hasLive ? 'binance' : 'seed' },
  });
}
