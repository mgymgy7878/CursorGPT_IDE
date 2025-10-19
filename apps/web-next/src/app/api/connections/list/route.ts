import { NextResponse } from "next/server";
import { fetchSafe } from "@/lib/net/fetchSafe";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = `${EXECUTOR_BASE}/connections/list`;
  const res = await fetchSafe(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  const headers: Record<string, string> = {};
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) headers["Retry-After"] = retryAfter;

  return NextResponse.json(res.data, {
    status: res.ok ? 200 : 200, // Always 200 with _err field
    headers
  });
}
