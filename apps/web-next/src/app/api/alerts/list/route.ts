import { NextResponse } from "next/server";
import { fetchSafe } from "@/lib/net/fetchSafe";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Proxy: UI → executor /alerts/list (graceful 200 + _err)
export async function GET() {
  const r = await fetchSafe(`${EXECUTOR_BASE}/alerts/list`, { method: "GET" });
  // Her durumda 200 + _err; UI tarafı çökmeyecek
  return NextResponse.json(
    r.data ?? { items: [], _err: r.data?._err ?? "unavailable" }, 
    { status: 200 }
  );
}
