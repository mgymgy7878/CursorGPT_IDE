import { NextResponse } from "next/server";

export const revalidate = 0;

const EXEC = process.env.EXEC_ORIGIN ?? "http://127.0.0.1:4001";

export async function GET() {
  try {
    const r = await fetch(`${EXEC}/guardrails/status`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const data = await r.json();
    return NextResponse.json({ ok: true, source: "executor", data }, { 
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 502 });
  }
} 