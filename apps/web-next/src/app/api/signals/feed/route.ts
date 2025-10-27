// apps/web-next/src/app/api/signals/feed/route.ts
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.toString();

  const r = await fetch(`http://127.0.0.1:4001/signals/feed${query ? `?${query}` : ''}`);

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': 'application/json' },
  });
}

