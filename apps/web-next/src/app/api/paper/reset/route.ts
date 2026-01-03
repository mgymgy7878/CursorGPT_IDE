/**
 * Paper Ledger Reset API - POST reset ledger to initial state
 *
 * Sadece paper modda çalışır (guard).
 * Smoke/QA tekrarlanabilirliği için.
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
        error: 'Paper ledger reset is only available in paper mode',
        currentMode: mode,
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const initialCash = body.initialCash || 10000; // Default: $10,000

    // Reset ledger
    paperLedger.reset(initialCash);

    // Get reset state
    const state = paperLedger.getState();

    return NextResponse.json(
      {
        message: 'Ledger reset successfully',
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

