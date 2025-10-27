import { NextResponse } from 'next/server';

/**
 * Mock Market Data API
 * GET /api/mock/market
 * 
 * Returns real-time market tickers for crypto pairs
 */

export async function GET() {
  const marketData = {
    tickers: [
      {
        symbol: 'BTCUSDT',
        price: 41986.63,
        changePct: 2.77,
        stalenessSec: 2,
      },
      {
        symbol: 'ETHUSDT',
        price: 2201.01,
        changePct: 1.71,
        stalenessSec: 2,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  // Simulate small network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return NextResponse.json(marketData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

