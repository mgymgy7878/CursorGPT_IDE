import { NextResponse } from 'next/server';
import { metrics } from '@/server/metrics';

// Dinamik çalış: build-time SSG denemesini engelle
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type NumRec = Record<string, number>;
const startedAt = Date.now();

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function GET() {
  // Mock health (UI bağlamak için): gerçek entegrasyonda doldurulacak
  const counters: NumRec = { ...metrics.counters } as NumRec;
  const gauges: NumRec = { ...metrics.gauges } as NumRec;

  if (!Number.isFinite(gauges['spark_ws_staleness_seconds'])) {
    gauges['spark_ws_staleness_seconds'] = 2;
  }
  const body = {
    gauges: { ws_staleness_s: num(gauges['spark_ws_staleness_seconds'], 2), p95_ms: 58 },
    counters: { ui_msgs_total: num(counters['ui_msgs_total'], 42), api_errors_total: num(counters['api_errors_total'], 0) },
    status: { env: 'Mock', feed: 'healthy', broker: 'offline' },
  };
  return NextResponse.json(body, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

