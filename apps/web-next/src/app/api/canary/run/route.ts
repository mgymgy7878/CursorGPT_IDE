import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

// Proxy: executor /canary/run (dry-run by default)
export async function POST(req: Request) {
  try {
    const inBody = await req.json().catch(()=> ({}));
    const body = { dryRun: true, ...inBody }; // UI'dan gelen override edebilir
    const r = await fetch(`${EXECUTOR_BASE}/canary/run`, {
      method: "POST",
      headers: { "content-type":"application/json","X-Spark-Actor":"ui","X-Spark-Source":"dashboard","X-Spark-Intent":"canary-run" },
      body: JSON.stringify(body),
    });
    const retryAfter = r.headers.get("retry-after") || undefined;
    const out = await r.json().catch(()=> ({}));
    return NextResponse.json({ ok: r.ok, retryAfter, ...out }, { status: r.ok ? 200 : (r.status || 500) });
  } catch (e:any) {
    // Graceful fallback
    return NextResponse.json({ ok:false, error: e?.message ?? "canary-proxy-fail" }, { status: 200 });
  }
}

