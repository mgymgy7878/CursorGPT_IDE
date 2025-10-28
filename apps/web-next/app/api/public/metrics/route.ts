import { NextResponse } from 'next/server';
import { metrics } from '@/server/metrics';

// Force dynamic rendering for production builds
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type NumRec = Record<string, number>;

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function GET() {
  // Mock health (UI için): gerçek entegrasyonda doldurulacak
  const counters: NumRec = { ...metrics.counters } as NumRec;
  const gauges: NumRec = { ...metrics.gauges } as NumRec;

  if (!Number.isFinite(gauges['spark_ws_staleness_seconds'])) {
    gauges['spark_ws_staleness_seconds'] = 2;
  }
  
  const body = {
    gauges: { 
      ws_staleness_s: num(gauges['spark_ws_staleness_seconds'], 2), 
      p95_ms: 123 
    },
    counters: { 
      ui_msgs_total: num(counters['ui_msgs_total'], 42), 
      api_errors_total: num(counters['api_errors_total'], 0) 
    },
    status: { 
      env: 'prod', 
      feed: 'healthy', 
      broker: 'offline' 
    },
  };
  
  return NextResponse.json(body, { 
    status: 200, 
    headers: { 
      'Cache-Control': 'no-store, max-age=0' 
    } 
  });
}

