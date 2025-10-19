export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(`${EXEC}/advisor/suggest`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Spark-Actor": "ui", "X-Spark-Source": "dashboard" },
    body,
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" },
  });
}


