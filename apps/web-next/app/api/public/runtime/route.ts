export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Runtime doğrulama: fetch mevcut mu, executor erişilebilir mi (best-effort)
  let ping: any = null;
  const origin = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
  try {
    const r = await fetch(`${origin}/health`, { cache: 'no-store' });
    ping = { ok: r.ok, status: r.status };
  } catch (e: any) {
    ping = { ok: false, error: String(e?.message ?? e) };
  }
  return new Response(JSON.stringify({
    node: process.version,
    executorOrigin: origin,
    ping
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}