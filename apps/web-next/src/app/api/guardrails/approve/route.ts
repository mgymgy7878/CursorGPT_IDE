export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(`${EXEC}/guardrails/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  }).catch(() => null);
  if (!r) {
    return new Response(JSON.stringify({ error: "network" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" },
  });
}


