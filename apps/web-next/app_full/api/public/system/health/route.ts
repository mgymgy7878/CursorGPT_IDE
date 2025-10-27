// Next.js App Router
export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      status: 'NORMAL',
      mode: 'mock',
      ts: Date.now(),
      mini: {
        ack_p95_ms: 0,
        evt_db_p95_ms: 0,
        fills_p95_ms: 0
      }
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}
