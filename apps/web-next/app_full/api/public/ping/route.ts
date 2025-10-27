export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ reachable: true, ts: Date.now(), via: 'ui' });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}