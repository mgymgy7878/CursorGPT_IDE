import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hours = parseInt(searchParams.get("hours") || "24");
  const severity = searchParams.get("severity"); // "warning" | "critical" | null (all)
  
  try {
    const url = `${EXECUTOR_BASE}/metrics/breaches?hours=${hours}${severity ? `&severity=${severity}` : ''}`;
    const res = await fetchSafe(url, { method: "GET" });
    
    if (!res.ok || res.data?._err) {
      // Return mock breach history
      const now = Date.now();
      const mockBreaches = [];
      
      // Generate 5-8 mock breaches in last 24h
      for (let i = 0; i < 6; i++) {
        const hoursAgo = Math.random() * hours;
        mockBreaches.push({
          timestamp: now - (hoursAgo * 60 * 60 * 1000),
          metric: ["p95_ms", "staleness_s", "error_rate"][Math.floor(Math.random() * 3)],
          value: Math.random() * 2000,
          threshold: 1000,
          severity: Math.random() > 0.7 ? "critical" : "warning",
          duration: Math.floor(Math.random() * 600) + 60 // 1-10min
        });
      }
      
      // Sort by timestamp desc
      mockBreaches.sort((a, b) => b.timestamp - a.timestamp);
      
      // Filter by severity if requested
      const filtered = severity 
        ? mockBreaches.filter(b => b.severity === severity)
        : mockBreaches;
      
      return NextResponse.json({
        breaches: filtered,
        total: filtered.length,
        period: `${hours}h`,
        _mock: true
      }, { status: 200 });
    }
    
    return NextResponse.json(res.data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { _err: `executor-unavailable: ${e?.message ?? "connection-failed"}` }, 
      { status: 200 }
    );
  }
}

