import { NextResponse } from 'next/server';
import type { OrderBook } from '@/lib/terminal/contracts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function hashSymbol(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % 10000;
  }
  return hash;
}

function buildSeedOrderBook(symbol: string): OrderBook {
  const base = 100 + (hashSymbol(symbol) % 1000);
  const bids = Array.from({ length: 8 }).map((_, i) => ({
    price: +(base - i * 0.5).toFixed(2),
    qty: +(0.4 + (i + 1) * 0.12).toFixed(3),
  }));
  const asks = Array.from({ length: 8 }).map((_, i) => ({
    price: +(base + i * 0.5).toFixed(2),
    qty: +(0.35 + (i + 1) * 0.1).toFixed(3),
  }));
  return { bids, asks };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || 'BTCUSDT').toUpperCase();
  const forceSeed = searchParams.get('seed') === '1';

  if (forceSeed) {
    return NextResponse.json({
      dataQuality: 'seed',
      orderBook: buildSeedOrderBook(symbol),
      _meta: { source: 'seed' },
    });
  }

  return NextResponse.json({
    dataQuality: 'seed',
    orderBook: buildSeedOrderBook(symbol),
    _meta: { source: 'seed' },
  });
}
