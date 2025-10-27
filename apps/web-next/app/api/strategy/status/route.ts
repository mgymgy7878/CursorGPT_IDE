export async function GET() {
  const origin = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
  const r = await fetch(`${origin}/strategy/status`, { cache: 'no-store' });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' }});
}
