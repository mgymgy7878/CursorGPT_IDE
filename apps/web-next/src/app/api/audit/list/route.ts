import { NextResponse } from "next/server";
import { fetchSafe } from "@/lib/net/fetchSafe";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  
  // Mock audit data when executor is unavailable
  const mockActions = [
    {
      id: "mock-1",
      action: "strategy.preview",
      result: "ok" as const,
      timestamp: Date.now() - 30000,
      details: "BTCUSDT 1h strategy preview",
      traceId: "ui-mock-1"
    },
    {
      id: "mock-2", 
      action: "canary.run",
      result: "ok" as const,
      timestamp: Date.now() - 60000,
      details: "Dry-run canary test",
      traceId: "ui-mock-2"
    },
    {
      id: "mock-3",
      action: "tools.get_metrics",
      result: "ok" as const,
      timestamp: Date.now() - 90000,
      details: "Market metrics fetch",
      traceId: "ui-mock-3"
    },
    {
      id: "mock-4",
      action: "strategy.generate",
      result: "ok" as const,
      timestamp: Date.now() - 120000,
      details: "AI strategy generation",
      traceId: "ui-mock-4"
    },
    {
      id: "mock-5",
      action: "backtest.run",
      result: "ok" as const,
      timestamp: Date.now() - 150000,
      details: "Portfolio backtest",
      traceId: "ui-mock-5"
    }
  ];

  try {
    const url = `${EXECUTOR_BASE}/audit/list`;
    const res = await fetchSafe(url, { method: "POST", body });
    
    if (res.ok && res.data && !res.data._err) {
      return NextResponse.json(res.data, { status: 200 });
    } else {
      // Executor returned error, use mock data
      return NextResponse.json({
        items: mockActions,
        _err: res.data?._err ?? "executor-error",
        _mock: true
      }, { status: 200 });
    }
  } catch (e: any) {
    // Executor unreachable, use mock data
    return NextResponse.json({
      items: mockActions,
      _err: `Executor unavailable: ${e?.message ?? "connection-failed"}`,
      _mock: true
    }, { status: 200 });
  }
}