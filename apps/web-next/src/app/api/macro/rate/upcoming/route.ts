export const dynamic = "force-dynamic";
export const revalidate = 0;
// apps/web-next/src/app/api/macro/rate/upcoming/route.ts
export const runtime = 'nodejs';

export async function GET() {
  const r = await fetch('http://127.0.0.1:4001/macro/rate/upcoming');

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': 'application/json' },
  });
}

