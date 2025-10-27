import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
  const body = await req.json();
  const r = await fetch(`${origin}/strategy/live/prepare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" }});
}
