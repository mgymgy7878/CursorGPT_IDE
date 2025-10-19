/**
 * BIST Snapshot API
 * GET /api/market/bist/snapshot?symbols=THYAO,AKBNK
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  const symbols = symbolsParam ? symbolsParam.split(',') : ['THYAO', 'AKBNK'];

  try {
    const { fetchBISTSnapshots } = await import('@/lib/marketdata/bist');
    
    const snapshots = await fetchBISTSnapshots(symbols);

    return Response.json(
      {
        success: true,
        data: snapshots,
        count: snapshots.length,
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

