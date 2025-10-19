import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const window = searchParams.get("window") || "7d";
  
  if (!["7d", "30d", "90d"].includes(window)) {
    return NextResponse.json(
      { _err: "window must be '7d', '30d', or '90d'" }, 
      { status: 400 }
    );
  }
  
  try {
    const url = `${EXECUTOR_BASE}/metrics/timeseries?window=${window}`;
    const res = await fetchSafe(url, { method: "GET" });
    
    if (!res.ok || res.data?._err) {
      // Return mock timeseries if executor unavailable
      const now = Date.now();
      const days = parseInt(window.replace('d', ''));
      const mockData = [];
      
      // Generate mock datapoints (1 per day)
      for (let i = days; i >= 0; i--) {
        const timestamp = now - (i * 24 * 60 * 60 * 1000);
        mockData.push({
          timestamp,
          p95_ms: 800 + Math.random() * 400, // 800-1200ms
          staleness_s: 30 + Math.random() * 40, // 30-70s
          error_rate: 0.005 + Math.random() * 0.01 // 0.5-1.5%
        });
      }
      
      return NextResponse.json({
        data: mockData,
        window,
        _mock: true
      }, { status: 200 });
    }
    
    return NextResponse.json({
      data: res.data?.data || [],
      window,
      generatedAt: Date.now()
    }, { status: 200 });
  } catch (e: any) {
    // Return mock data on error
    const now = Date.now();
    const days = parseInt(window.replace('d', ''));
    const mockData = [];
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      mockData.push({
        timestamp,
        p95_ms: 800 + Math.random() * 400,
        staleness_s: 30 + Math.random() * 40,
        error_rate: 0.005 + Math.random() * 0.01
      });
    }
    
    return NextResponse.json({
      data: mockData,
      window,
      _mock: true,
      _err: `executor-unavailable: ${e?.message ?? "connection-failed"}`
    }, { status: 200 });
  }
}

