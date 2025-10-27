export const dynamic = "force-dynamic";
export async function GET() {
  const origin = process.env.EXECUTOR_ORIGIN;
  if (!origin) return new Response('data: {"error":"missing_EXECUTOR_ORIGIN"}\n\n', { status: 500, headers: { "content-type": "text/event-stream" } });
  const r = await fetch(`${origin}/api/public/market/stream`, { cache: "no-store" });
  const headers = new Headers(r.headers);
  headers.set("cache-control", "no-store");
  headers.set("content-type", "text/event-stream");
  return new Response(r.body, { status: r.status, headers });
} 