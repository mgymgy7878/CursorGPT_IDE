import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { variants, strategyNamePrefix, code, symbol, timeframe } = body;
  
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json(
      { _err: "variants array required" }, 
      { status: 400 }
    );
  }
  
  const results: Array<{
    index: number;
    strategyId?: string;
    draft: boolean;
    ok: boolean;
    _err?: string;
  }> = [];
  
  try {
    // Create drafts sequentially (could be parallelized)
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const strategyName = `${strategyNamePrefix || 'Optimized'}-${i + 1}-${Date.now()}`;
      
      try {
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
              promotedAt: Date.now(),
              batchIndex: i
            }
          },
          headers: { "Content-Type": "application/json" }
        });
        
        if (!res.ok || res.data?._err) {
          results.push({
            index: i,
            draft: false,
            ok: false,
            _err: res.data?._err ?? "creation failed"
          });
        } else {
          results.push({
            index: i,
            strategyId: res.data?.id || res.data?.strategyId || strategyName,
            draft: true,
            ok: true
          });
          
          // Audit push for each
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "optimization.promote",
              result: "ok",
              strategyId: strategyName,
              timestamp: Date.now(),
              details: `Batch promoted [${i + 1}/${variants.length}]: ${JSON.stringify(variant.params).slice(0, 80)}`
            })
          }).catch(() => {});
        }
      } catch (e: any) {
        results.push({
          index: i,
          draft: false,
          ok: false,
          _err: e?.message ?? "exception"
        });
      }
    }
    
    const successCount = results.filter(r => r.ok).length;
    const failCount = results.filter(r => !r.ok).length;
    
    return NextResponse.json({
      ok: successCount > 0,
      total: variants.length,
      success: successCount,
      failed: failCount,
      results
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { _err: `batch-promote-failed: ${e?.message ?? "unknown"}` }, 
      { status: 200 }
    );
  }
}

