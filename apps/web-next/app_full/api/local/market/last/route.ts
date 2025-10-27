import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const origin = process.env.EXECUTOR_ORIGIN;
  if (!origin) return NextResponse.json({ error: "missing_EXECUTOR_ORIGIN" }, { status: 500 });
  try {
    const r = await fetch(`${origin}/api/public/market/last`, { cache: "no-store" });
    const body = await r.json().catch(()=>({}));
    return NextResponse.json(body, { status: r.status });
  } catch (e:any) {
    return NextResponse.json({ error: "proxy_failed", reason: e?.message || "fetch_error" }, { status: 502 });
  }
} 