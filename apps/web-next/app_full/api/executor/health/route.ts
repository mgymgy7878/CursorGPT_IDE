export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const r = await fetch('http://127.0.0.1:4001/health', { cache: 'no-store' });
    const j = await r.json();
    return Response.json(j, { status: r.ok ? 200 : 502 });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}

export async function HEAD() { return new Response(null, { status: 200 }); }
