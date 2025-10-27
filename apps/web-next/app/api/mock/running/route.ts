import { NextResponse } from 'next/server';

/**
 * Mock Running Strategies API
 * GET /api/mock/running
 * 
 * Returns list of running, paused, and stopped strategies
 */

export async function GET() {
  const runningData = {
    strategies: [
      {
        id: 'btc-ema',
        name: 'BTC EMA Cross',
        status: 'running' as const,
        pnlUSD: 125.50,
        trades: 12,
        capitalUSD: 1000,
        startedAt: '10:30',
      },
      {
        id: 'eth-grid',
        name: 'ETH Grid',
        status: 'running' as const,
        pnlUSD: 89.20,
        trades: 45,
        capitalUSD: 2000,
        startedAt: '09:15',
      },
      {
        id: 'sol-momo',
        name: 'SOL Momentum',
        status: 'paused' as const,
        pnlUSD: -15.30,
        trades: 8,
        capitalUSD: 500,
        startedAt: '08:00',
      },
      {
        id: 'bist30-swing',
        name: 'BIST30 Swing',
        status: 'stopped' as const,
        pnlUSD: 245.70,
        trades: 23,
        capitalUSD: 5000,
        startedAt: '2025-10-24',
      },
      {
        id: 'ada-scalper',
        name: 'ADA Scalper',
        status: 'running' as const,
        pnlUSD: 34.10,
        trades: 67,
        capitalUSD: 800,
        startedAt: '11:45',
      },
    ],
    summary: {
      totalPnlUSD: 479.20,
      activeCount: 3,
      pausedCount: 1,
      stoppedCount: 1,
    },
    timestamp: new Date().toISOString(),
  };

  // Simulate small network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return NextResponse.json(runningData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

