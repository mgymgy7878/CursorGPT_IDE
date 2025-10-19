export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function GET() {
  const r = await fetch(`${EXEC}/alerts/list`, { cache: "no-store" as any });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" }
  });
}


