import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const origin = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
  const r = await fetch(`${origin}/strategy/stop`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
