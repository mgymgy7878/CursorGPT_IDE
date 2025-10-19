import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { variant, strategyName, code, symbol, timeframe } = body;
  
  if (!variant || !strategyName) {
    return NextResponse.json(
      { _err: "variant and strategyName required" }, 
      { status: 400 }
    );
  }
  
  try {
    // Create draft strategy with optimized parameters
    const url = `${EXECUTOR_BASE}/strategies/create`;
    const res = await fetchSafe(url, { 
      method: "POST", 
      body: {
        name: strategyName,
        code: code || "// Optimized strategy code",
        params: variant.params,
        symbol: symbol || "BTCUSDT",
        timeframe: timeframe || "1h",
        draft: true,
        optimization: {
          metrics: variant.metrics,
          promoted: true,
          promotedAt: Date.now()
        }
      },
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok || res.data?._err) {
      return NextResponse.json(
        { _err: res.data?._err ?? "strategy creation failed" }, 
        { status: 200 }
      );
    }
    
    // Audit push
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "optimization.promote",
        result: "ok",
        strategyId: strategyName,
        timestamp: Date.now(),
        details: `Promoted variant to draft: ${JSON.stringify(variant.params).slice(0, 100)}`
      })
    }).catch(() => {});
    
    return NextResponse.json({
      ok: true,
      strategyId: res.data?.id || res.data?.strategyId,
      draft: true,
      ...res.data
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { _err: `executor-unavailable: ${e?.message ?? "connection-failed"}` }, 
      { status: 200 }
    );
  }
}

