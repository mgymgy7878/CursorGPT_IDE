import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
  try {
    const r = await fetch(`${origin}/api/public/diag/env`, { cache: "no-store" });
    const j = await r.json();
    return NextResponse.json(j, { status: r.status });
  } catch {
    return NextResponse.json({ error: "executor_unreachable" }, { status: 502 });
  }
} 