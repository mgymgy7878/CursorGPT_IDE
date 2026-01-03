/**
 * Paper Order API - POST simulate market order
 * 
 * Sadece paper modda çalışır (guard).
 * Trade yok, sadece simülasyon.
 */

import { NextResponse } from 'next/server';
import { paperLedger } from '@/lib/paper/ledger';
import { getSparkMode } from '@/lib/spark/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Guard: sadece paper modda çalışır
  const mode = getSparkMode();
  if (mode !== 'paper') {
    return NextResponse.json(
      {
        error: 'Paper orders are only available in paper mode',
        currentMode: mode,
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { symbol, side, qty, marketPrice } = body;

    // Validation
    if (!symbol || !side || !qty || !marketPrice) {
      return NextResponse.json(
        {
          error: 'Missing required fields: symbol, side, qty, marketPrice',
        },
        { status: 400 }
      );
    }

    if (side !== 'buy' && side !== 'sell') {
      return NextResponse.json(
        {
          error: 'side must be "buy" or "sell"',
        },
        { status: 400 }
      );
    }

    if (qty <= 0 || marketPrice <= 0) {
      return NextResponse.json(
        {
          error: 'qty and marketPrice must be positive',
        },
        { status: 400 }
      );
    }

    // Simulate order
    const fill = paperLedger.simulateMarketOrder(
      symbol.toUpperCase(),
      side,
      qty,
      marketPrice
    );

    // Get updated state
    const state = paperLedger.getState();

    return NextResponse.json(
      {
        fill,
        state,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

