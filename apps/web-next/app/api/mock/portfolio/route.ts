import { NextResponse } from 'next/server';

/**
 * Mock Portfolio API
 * GET /api/mock/portfolio
 * 
 * Returns portfolio summary, exchange connection status, and open positions
 */

export async function GET() {
  // Simulate realistic data from screenshots
  const portfolioData = {
    exchange: {
      name: 'Binance',
      online: true,
      lastSyncSec: 120, // 2 minutes ago
      rateLimit: '1200/1200',
      apiStatus: 'active',
    },
    totals: {
      pnl24hUSD: 1247.50,
      totalUSD: 12847.50,
      freeUSD: 8500.00,
      lockedUSD: 4347.50,
    },
    positions: [
      {
        symbol: 'BTCUSDT',
        qty: 0.25,
        avgPrice: 42500.00,
        currentPrice: 43000.00,
        pnlUSD: 125.50,
        pnlPct: 2.1,
        side: 'long' as const,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  // Simulate small network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return NextResponse.json(portfolioData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

