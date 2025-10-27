import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const origin = process.env.EXECUTOR_ORIGIN?.trim() || "http://127.0.0.1:4001";
  const res = await fetch(`${origin}/canary/policy`, { method: "GET" });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
} 