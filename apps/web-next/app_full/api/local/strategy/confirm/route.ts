import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN; const token = process.env.EXECUTOR_TOKEN || "";
  if (!origin) return NextResponse.json({ error: "missing_EXECUTOR_ORIGIN" }, { status: 500 });
  const body = await req.json().catch(()=>({}));
  const r = await fetch(`${origin}/api/public/strategy/confirm`, {
    method: "POST",
    headers: { "content-type":"application/json", "authorization":`Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(()=>({}));
  return NextResponse.json(data, { status: r.status });
} 