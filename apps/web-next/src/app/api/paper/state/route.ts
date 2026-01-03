/**
 * Paper Ledger State API - GET current ledger state
 * 
 * Sadece paper modda çalışır (guard).
 */

import { NextResponse } from 'next/server';
import { paperLedger } from '@/lib/paper/ledger';
import { getSparkMode } from '@/lib/spark/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Guard: sadece paper modda çalışır
  const mode = getSparkMode();
  if (mode !== 'paper') {
    return NextResponse.json(
      {
        error: 'Paper ledger is only available in paper mode',
        currentMode: mode,
      },
      { status: 400 }
    );
  }

  try {
    const state = paperLedger.getState();
    return NextResponse.json(state, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
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

