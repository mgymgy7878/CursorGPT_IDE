/**
 * Optimize Run API - POST start optimization job
 *
 * Real engine integration: Uses engine adapter for parameter sweep optimization.
 */

import { NextResponse } from 'next/server';
import { jobStore } from '@/lib/jobs/jobStore';
import { getEngineAdapter } from '@/lib/engines/engineAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Prod hard-disable: production'da stub API'leri kapalı
  const nodeEnv = process.env.NODE_ENV as string;
  if (nodeEnv === 'production') {
    return NextResponse.json(
      {
        error: 'Optimize stub is not available in production',
      },
      { status: 404 }
    );
  }

  // Prod enable check: real engine requires explicit enable
  const engineMode = process.env.SPARK_ENGINE_MODE || 'stub';
  const realEngineEnabled = process.env.SPARK_ENGINE_REAL_ENABLE === '1';
  if (engineMode === 'real' && !realEngineEnabled && nodeEnv === 'production') {
    return NextResponse.json(
      {
        error: 'Real engine requires SPARK_ENGINE_REAL_ENABLE=1 in production',
      },
      { status: 403 }
    );
  }

  const requestId = require('crypto').randomUUID().split('-')[0];
  const startTime = Date.now();
  const MAX_RUNTIME = nodeEnv === 'production' ? 1500 : 3000; // 1.5s prod, 3s dev

  try {
    const body = await request.json().catch(() => ({}));
    const { symbol, interval, parameters, baselineMetrics } = body; // baselineMetrics: Backtest → Optimize wiring

    // Validation
    if (!symbol) {
      return NextResponse.json(
        {
          error: 'symbol parameter is required',
          requestId,
        },
        { status: 400 }
      );
    }

    // For real engine, we need klines data (same as backtest)
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

        if (klines && klines.length < 100) {
          console.warn(`[optimize] requestId=${requestId} insufficient klines: ${klines.length}`);
        }
      } catch (error) {
        console.error(`[optimize] requestId=${requestId} klines fetch failed:`, error);
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

    // Create job with input (including baselineMetrics from backtest and klines for real engine)
    const input = {
      symbol,
      interval,
      parameters,
      baselineMetrics, // Backtest → Optimize wiring
      klines, // For real engine optimization
    };
    const jobId = jobStore.createJob('optimize', input);

    const finalElapsed = Date.now() - startTime;
    console.log(`[optimize] requestId=${requestId} jobId=${jobId} elapsed=${finalElapsed}ms engineMode=${engineMode}`);

    return NextResponse.json(
      {
        jobId,
        message: 'Optimization job started',
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
    console.error(`[optimize] requestId=${requestId} error after ${elapsed}ms:`, error);
    return NextResponse.json(
      {
        error: errorMessage,
        requestId,
      },
      { status: 500 }
    );
  }
}
