import { NextRequest, NextResponse } from "next/server";
import { fetchSafe } from "@/lib/net/fetchSafe";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxy: UI → executor /advisor/strategy/preview
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = `${EXECUTOR_BASE}/advisor/strategy/preview`;
  const res = await fetchSafe(url, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" }
  });
  const headers: Record<string,string> = {};
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) headers["Retry-After"] = retryAfter;
  // Graceful: her durumda 200 + _err field
  return NextResponse.json(res.data, { status: 200, headers });
}

