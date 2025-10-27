import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'BTCTRY').toUpperCase();

  // basit mock (bid < ask, last ~ mid)
  const bid = 1000000 + Math.floor(Math.random() * 5000);  // 1,000,000 TRY civarı
  const ask = bid + 150;                                    // 1.5 TRY spread
  const last = Math.round((bid + ask) / 2);

  return new Response(
    JSON.stringify({
      ok: true,
      mock: true,
      symbol,
      bid,
      ask,
      last,
      ts: Date.now(),
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}
