/**
 * Backtest Run API - POST start backtest job
 * 
 * Job-state stub: gerçek engine yokken bile "çalışıyor" hissini verir.
 */

import { NextResponse } from 'next/server';
import { jobStore } from '@/lib/jobs/jobStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { symbol, interval, startDate, endDate } = body;

    // Validation (optional, şimdilik basit)
    if (!symbol) {
      return NextResponse.json(
        {
          error: 'symbol parameter is required',
        },
        { status: 400 }
      );
    }

    // Create job
    const jobId = jobStore.createJob('backtest');

    return NextResponse.json(
      {
        jobId,
        message: 'Backtest job started',
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
