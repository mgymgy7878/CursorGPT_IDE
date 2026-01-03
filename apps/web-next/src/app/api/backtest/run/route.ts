/**
 * Backtest Run API - POST start backtest job
 *
 * Job-state stub: gerçek engine yokken bile "çalışıyor" hissini verir.
 */

import { NextResponse } from 'next/server';
import { jobStore } from '@/lib/jobs/jobStore';
import { getEngineAdapter } from '@/lib/engines/engineAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Prod hard-disable: production'da stub API'leri kapalı
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        error: 'Backtest stub is not available in production',
      },
      { status: 404 }
    );
  }

  // Prod enable check: real engine requires explicit enable
  const engineMode = process.env.SPARK_ENGINE_MODE || 'stub';
  const realEngineEnabled = process.env.SPARK_ENGINE_REAL_ENABLE === '1';
  if (engineMode === 'real' && !realEngineEnabled && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        error: 'Real engine requires SPARK_ENGINE_REAL_ENABLE=1 in production',
      },
      { status: 403 }
    );
  }

  const requestId = require('crypto').randomUUID().split('-')[0];
  const startTime = Date.now();
  const MAX_RUNTIME = process.env.NODE_ENV === 'production' ? 1500 : 3000; // 1.5s prod, 3s dev

  try {
    const body = await request.json().catch(() => ({}));
    const { symbol, interval, startDate, endDate, baselineMetrics } = body; // baselineMetrics: Backtest → Optimize wiring

    // Validation (optional, şimdilik basit)
    if (!symbol) {
      return NextResponse.json(
        {
          error: 'symbol parameter is required',
          requestId,
        },
        { status: 400 }
      );
    }

    // Fetch klines if not provided (for real engine)
    let klines: number[][] | undefined;
    if (engineMode === 'real') {
      try {
        const { BinanceSpotClient } = require('@/lib/exchanges/binance/spotClient');
        const client = new BinanceSpotClient({ timeout: 5000, requestId });
        klines = await client.getKlines({
          symbol,
          interval,
          limit: 200,
        });
        
        // Log klines validation result
        if (klines && klines.length < 100) {
          console.warn(`[backtest] requestId=${requestId} insufficient klines: ${klines.length}`);
        }
      } catch (error) {
        console.error(`[backtest] requestId=${requestId} klines fetch failed:`, error);
        throw new Error(`Failed to fetch klines: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Timeout check
    const elapsed = Date.now() - startTime;
    if (elapsed >= MAX_RUNTIME) {
      return NextResponse.json(
        {
          error: 'Request timeout',
          reason: 'timeout',
          requestId,
        },
        { status: 408 }
      );
    }

    // Create job with input
    const input = {
      symbol,
      interval,
      startDate,
      endDate,
      klines,
    };
    const jobId = jobStore.createJob('backtest', input);

    const elapsed = Date.now() - startTime;
    console.log(`[backtest] requestId=${requestId} jobId=${jobId} elapsed=${elapsed}ms engineMode=${engineMode}`);

    return NextResponse.json(
      {
        jobId,
        message: 'Backtest job started',
        requestId,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const elapsed = Date.now() - startTime;
    console.error(`[backtest] requestId=${requestId} error after ${elapsed}ms:`, error);
    return NextResponse.json(
      {
        error: errorMessage,
        requestId,
      },
      { status: 500 }
    );
  }
}
