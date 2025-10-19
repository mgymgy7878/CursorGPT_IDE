export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(`${EXEC}/reports/sign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  }).catch(() => null);
  if (!r) {
    return new Response("network", { status: 502 });
  }
  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);
  return new Response(buf, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/pdf",
      "content-disposition": r.headers.get("content-disposition") ?? "",
    },
  });
}


