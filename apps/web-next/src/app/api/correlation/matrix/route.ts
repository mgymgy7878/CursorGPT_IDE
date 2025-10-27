// apps/web-next/src/app/api/correlation/matrix/route.ts
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const universe = url.searchParams.get('universe') || 'BIST_CORE';
  
  const r = await fetch(`http://127.0.0.1:4001/correlation/matrix?universe=${universe}`);

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': 'application/json' },
  });
}

