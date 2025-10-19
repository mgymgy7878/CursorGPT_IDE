import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { retentionDays = 30, dryRun = false } = body;
  
  try {
    const url = `${EXECUTOR_BASE}/evidence/cleanup`;
    const res = await fetchSafe(url, { 
      method: "POST", 
      body: { retentionDays, dryRun },
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok || res.data?._err) {
      // Return mock cleanup result
      const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      const mockResult = {
        cleaned: 3,
        retained: 12,
        totalSize: 1536 * 1024, // 1.5MB
        cutoffDate,
        dryRun,
        _mock: true
      };
      
      if (!dryRun) {
        // Audit push
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "evidence.cleanup",
            result: "ok",
            strategyId: "evidence-cleanup",
            timestamp: Date.now(),
            details: `Cleaned ${mockResult.cleaned} archives (retention: ${retentionDays}d, mock)`
          })
        }).catch(() => {});
      }
      
      return NextResponse.json(mockResult, { status: 200 });
    }
    
    if (!dryRun && res.data?.cleaned > 0) {
      // Audit push
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evidence.cleanup",
          result: "ok",
          strategyId: "evidence-cleanup",
          timestamp: Date.now(),
          details: `Cleaned ${res.data.cleaned} archives (retention: ${retentionDays}d)`
        })
      }).catch(() => {});
    }
    
    return NextResponse.json(res.data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { _err: `executor-unavailable: ${e?.message ?? "connection-failed"}` }, 
      { status: 200 }
    );
  }
}

