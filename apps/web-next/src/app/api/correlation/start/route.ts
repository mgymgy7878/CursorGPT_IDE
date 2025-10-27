// apps/web-next/src/app/api/correlation/start/route.ts
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json();
  
  const r = await fetch('http://127.0.0.1:4001/correlation/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': 'application/json' },
  });
}

