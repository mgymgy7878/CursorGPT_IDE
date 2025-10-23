import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const startedAt = Date.now();

export async function GET() {
  const counters: Record<string, number> = {
    spark_ws_btcturk_msgs_total: Math.max(0, Math.floor((Date.now() - startedAt) / 2000)),
  };
  const gauges: Record<string, number> = {
    spark_ws_staleness_seconds: 0.5,
  };
  return NextResponse.json({ counters, gauges }, { status: 200 });
}


