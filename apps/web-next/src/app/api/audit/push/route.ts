import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  
  try {
    const url = `${EXECUTOR_BASE}/audit/push`;
    const res = await fetchSafe(url, { 
      method: "POST", 
      body,
      headers: { "Content-Type": "application/json" }
    });
    
    return NextResponse.json(
      res.data ?? { ok: res.ok, _err: res.data?._err ?? "unknown" }, 
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, _err: `executor-unavailable: ${e?.message ?? "connection-failed"}` }, 
      { status: 200 }
    );
  }
}

