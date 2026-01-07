/**
 * Backtest Status API - GET job status
 *
 * Job-state stub: polling için status döndürür.
 */

import { NextResponse } from 'next/server';
import { jobStore } from '@/lib/jobs/jobStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        {
          error: 'jobId parameter is required',
        },
        { status: 400 }
      );
    }

    const job = jobStore.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        jobId: job.jobId,
        type: job.type,
        status: job.status,
        progressPct: job.progressPct,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        result: job.result,
        error: job.error,
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

