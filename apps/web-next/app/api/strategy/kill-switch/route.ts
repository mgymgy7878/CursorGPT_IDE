import { NextRequest } from "next/server";

export async function GET() {
  const origin = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
  const r = await fetch(`${origin}/strategy/kill-switch`, { cache: "no-store" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" }});
}

export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
  const body = await req.json();
  const r = await fetch(`${origin}/strategy/kill-switch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" }});
}
