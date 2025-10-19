import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { runId, jobId, zipUrl, retention = 30 } = body;
  
  if (!runId && !jobId) {
    return NextResponse.json(
      { _err: "runId or jobId required" }, 
      { status: 400 }
    );
  }
  
  try {
    // Mock S3/blob upload - in production this would call actual storage service
    const url = `${EXECUTOR_BASE}/evidence/archive`;
    const res = await fetchSafe(url, { 
      method: "POST", 
      body: {
        runId: runId || jobId,
        zipUrl: zipUrl || `mock://evidence/${runId || jobId}.zip`,
        retention,
        bucket: "spark-evidence",
        region: "eu-central-1"
      },
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok || res.data?._err) {
      // Return mock archive metadata if executor unavailable
      const mockArchive = {
        archiveId: `archive-${Date.now()}`,
        runId: runId || jobId,
        url: `https://mock-s3.example.com/spark-evidence/${runId || jobId}.zip`,
        bucket: "spark-evidence",
        retention: retention,
        expiresAt: Date.now() + (retention * 24 * 60 * 60 * 1000),
        size: 1024 * 512, // 512KB mock
        _mock: true
      };
      
      // Audit push
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evidence.archive",
          result: "ok",
          strategyId: "evidence-archive",
          traceId: runId || jobId,
          timestamp: Date.now(),
          details: `Evidence archived (mock): ${mockArchive.url} (${retention}d retention)`
        })
      }).catch(() => {});
      
      return NextResponse.json(mockArchive, { status: 200 });
    }
    
    // Audit push
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "evidence.archive",
        result: "ok",
        strategyId: "evidence-archive",
        traceId: runId || jobId,
        timestamp: Date.now(),
        details: `Evidence archived: ${res.data?.url || "unknown"} (${retention}d retention)`
      })
    }).catch(() => {});
    
    return NextResponse.json(res.data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { _err: `executor-unavailable: ${e?.message ?? "connection-failed"}` }, 
      { status: 200 }
    );
  }
}

