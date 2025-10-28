export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
  const lines = [
    '# HELP app_up 1 if app is up',
    '# TYPE app_up gauge',
    'app_up 1',
    '# HELP app_p95_ms request p95 ms',
    '# TYPE app_p95_ms gauge',
    'app_p95_ms 123',
    '# HELP ws_staleness_s websocket staleness seconds',
    '# TYPE ws_staleness_s gauge',
    'ws_staleness_s 2'
  ].join('\n');
  return new Response(lines + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
      'Cache-Control': 'no-store'
    }
  });
}
