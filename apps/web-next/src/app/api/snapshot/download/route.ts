import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { format = "json", hours = 24 } = body;
  
  if (!["json", "csv"].includes(format)) {
    return NextResponse.json(
      { _err: "format must be 'json' or 'csv'" }, 
      { status: 400 }
    );
  }
  
  try {
    const url = `${EXECUTOR_BASE}/snapshot/export`;
    const res = await fetchSafe(url, { 
      method: "POST", 
      body: { format, hours },
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok || res.data?._err) {
      // Return mock data if executor unavailable
      const buildSha = process.env.BUILD_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "dev-local";
      const environment = process.env.NODE_ENV || "development";
      
      const mockData = {
        timestamp: Date.now(),
        period: `${hours}h`,
        buildSha,
        environment,
        slo: {
          p95_ms: 850,
          staleness_s: 45,
          error_rate: 0.005
        },
        audit: [
          { ts: Date.now() - 3600000, action: "strategy.preview", result: "ok" },
          { ts: Date.now() - 7200000, action: "canary.test", result: "ok" }
        ],
        _mock: true
      };
      
      if (format === "csv") {
        const csv = [
          `# Spark Trading Platform - Snapshot Export`,
          `# Environment: ${mockData.environment}`,
          `# Build SHA: ${mockData.buildSha}`,
          `# Exported At: ${new Date(mockData.timestamp).toISOString()}`,
          `# Period: ${hours} hours`,
          "",
          "timestamp,action,result",
          ...mockData.audit.map(a => `${a.ts},${a.action},${a.result}`)
        ].join("\n");
        
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="snapshot-${hours}h-${Date.now()}.csv"`
          }
        });
      } else {
        return NextResponse.json(mockData, { 
          status: 200,
          headers: {
            "Content-Disposition": `attachment; filename="snapshot-${hours}h-${Date.now()}.json"`
          }
        });
      }
    }
    
    // Audit push
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/audit/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "snapshot.export",
        result: "ok",
        strategyId: "snapshot",
        timestamp: Date.now(),
        details: `Exported ${format.toUpperCase()} snapshot (${hours}h)`
      })
    }).catch(() => {});
    
    // Return appropriate response based on format
    if (format === "csv" && res.data?.csv) {
      return new NextResponse(res.data.csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="snapshot-${hours}h-${Date.now()}.csv"`
        }
      });
    } else {
      return NextResponse.json(res.data, { 
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="snapshot-${hours}h-${Date.now()}.json"`
        }
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { _err: `executor-unavailable: ${e?.message ?? "connection-failed"}` }, 
      { status: 200 }
    );
  }
}

