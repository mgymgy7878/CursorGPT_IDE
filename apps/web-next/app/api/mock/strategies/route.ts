import { NextResponse } from 'next/server';

/**
 * Mock Strategies API
 * GET /api/mock/strategies
 * 
 * Returns list of user-created strategies with performance metrics
 */

export async function GET() {
  const strategiesData = {
    filters: {
      market: ['kripto', 'bist', 'hisse'],
      type: ['scalping', 'grid', 'spot', 'swing'],
    },
    items: [
      {
        id: 'btc-ema',
        name: 'BTC EMA Crossover',
        tags: ['kripto', 'scalping'],
        perfPct: 12.5,
        lastRun: '2025-10-25',
        description: 'BTC 15m EMA 9/21 crossover stratejisi',
      },
      {
        id: 'eth-grid',
        name: 'ETH Grid Bot',
        tags: ['kripto', 'grid'],
        perfPct: 8.3,
        lastRun: '2025-10-24',
        description: 'ETH grid trading 50$ aralık',
      },
      {
        id: 'bist30-momo',
        name: 'BIST30 Momentum',
        tags: ['bist', 'swing'],
        perfPct: 15.2,
        lastRun: '2025-10-23',
        description: 'BIST30 endeksi momentum takip',
      },
      {
        id: 'tesla-spot',
        name: 'Tesla Spot',
        tags: ['hisse', 'spot'],
        perfPct: -2.1,
        lastRun: '2025-10-22',
        description: 'TSLA spot alım satım',
      },
      {
        id: 'sol-scalper',
        name: 'SOL Scalper',
        tags: ['kripto', 'scalping'],
        perfPct: 6.7,
        lastRun: '2025-10-21',
        description: 'SOL 5m scalping stratejisi',
      },
      {
        id: 'bnb-grid',
        name: 'BNB Grid',
        tags: ['kripto', 'grid'],
        perfPct: 4.2,
        lastRun: '2025-10-20',
        description: 'BNB grid trading 20$ aralık',
      },
    ],
    total: 6,
    timestamp: new Date().toISOString(),
  };

  // Simulate small network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return NextResponse.json(strategiesData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

