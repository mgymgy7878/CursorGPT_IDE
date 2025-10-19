import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

// Proxy: executor /tools/get_metrics → normalize to { p95_ms, staleness_s, error_rate }
export async function GET() {
  try {
    const r = await fetch(`${EXECUTOR_BASE}/tools/get_metrics`, {
      headers: { "X-Spark-Actor":"ui", "X-Spark-Source":"dashboard", "X-Spark-Intent":"get-metrics" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`executor ${r.status}`);
    const raw = await r.json();

    // Normalize → MarketsWidget expected shape
    const p95 = Number(raw?.latency_p95_ms ?? raw?.p95_ms ?? 0);
    const stale = Number(raw?.staleness_s ?? raw?.stale_s ?? 0);
    const err = Number(raw?.error_rate ?? raw?.errors_per_s ?? 0);

    return NextResponse.json({ p95_ms: p95, staleness_s: stale, error_rate: err });
  } catch (e:any) {
    // Graceful fallback: return zeros, no crash
    return NextResponse.json({ p95_ms: 0, staleness_s: 0, error_rate: 0, _err: e?.message ?? "proxy-fail" }, { status: 200 });
  }
}

