/**
 * Binance Klines Proxy - Server-side proxy for Binance Spot API
 * 
 * Client'ta key taşımadan klines çeker.
 * Rate-limit / cache (basit) opsiyon.
 */

import { NextResponse } from 'next/server';
import { BinanceSpotClient } from '@/lib/exchanges/binance/spotClient';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1h';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    if (!symbol) {
      return NextResponse.json(
        { error: 'symbol parameter is required' },
        { status: 400 }
      );
    }

    // Generate requestId for tracing
    const requestId = randomUUID().split('-')[0];

    // Create client and fetch klines
    const client = new BinanceSpotClient({ timeout: 5000, requestId });
    const klines = await client.getKlines({
      symbol,
      interval,
      limit,
    });

    return NextResponse.json(
      {
        symbol,
        interval,
        klines,
        requestId,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

