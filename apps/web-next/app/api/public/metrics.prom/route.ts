import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Prometheus 0.0.4 uyumlu minimal çıktı
  const lines = [
    '# TYPE web_next_p95_ms gauge',
    'web_next_p95_ms 123',
    '# TYPE web_next_ws_staleness_seconds gauge',
    'web_next_ws_staleness_seconds 2',
    '# TYPE web_next_http_2xx counter',
    'web_next_http_2xx 6',
    '# TYPE web_next_http_5xx counter',
    'web_next_http_5xx 0'
  ].join('\n');
  return new NextResponse(lines, { status: 200, headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
