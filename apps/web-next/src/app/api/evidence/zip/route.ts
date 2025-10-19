import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { runId, jobId, type = "canary" } = body;
  
  if (!runId && !jobId) {
    return NextResponse.json(
      { _err: "runId or jobId required" }, 
      { status: 400 }
    );
  }
  
  try {
    const buildSha = process.env.BUILD_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "dev-local";
    const environment = process.env.NODE_ENV || "development";
    
    // Import ML version if needed
    let mlMetadata = {};
    try {
      const { FEATURE_VERSION, MODEL_VERSION } = await import("@/lib/ml/featureVersion");
      mlMetadata = { featureVersion: FEATURE_VERSION, modelVersion: MODEL_VERSION };
    } catch {
      mlMetadata = {};
    }
    
    const url = `${EXECUTOR_BASE}/evidence/zip`;
    const res = await fetchSafe(url, { 
      method: "POST", 
      body: { 
        runId: runId || jobId, 
        type,
        metadata: {
          buildSha,
          environment,
          generatedAt: Date.now(),
          ...mlMetadata
        }
      },
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok || res.data?._err) {
      return NextResponse.json(
        { _err: res.data?._err ?? "evidence generation failed" }, 
        { status: 200 }
      );
    }
    
    // Audit push
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "evidence.create",
        result: "ok",
        strategyId: "evidence-zip",
        traceId: runId || jobId,
        timestamp: Date.now(),
        details: `Evidence ZIP created for ${type}: ${runId || jobId}`
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

