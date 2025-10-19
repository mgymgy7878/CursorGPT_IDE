export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function GET() {
  const r = await fetch(`${EXEC}/model/baseline`).catch(() => null);
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


