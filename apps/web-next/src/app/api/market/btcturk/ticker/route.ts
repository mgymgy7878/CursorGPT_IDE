/**
 * BTCTurk Ticker API
 * GET /api/market/btcturk/ticker?symbol=BTC_TRY
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC_TRY';

  try {
    const { fetchBTCTurkTicker } = await import('@/lib/marketdata/btcturk');
    
    const ticker = await fetchBTCTurkTicker(symbol);

    return Response.json(
      {
        success: true,
        data: ticker,
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        _mock: true,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

