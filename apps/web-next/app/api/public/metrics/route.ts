import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Prod öncesi mock JSON metrics
  const body = {
    status: { env: 'web-next', feed: 'mock', broker: 'mock' },
    gauges: { p95_ms: 123, ws_staleness_s: 2 },
    counters: { http_2xx: 6, http_5xx: 0 }
  };
  return NextResponse.json(body, { status: 200 });
}
