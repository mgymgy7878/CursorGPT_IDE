import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";
import { fetchSafe } from "@/lib/net/fetchSafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = `${EXECUTOR_BASE}/guardrails/read`;
    const res = await fetchSafe(url, { method: "GET" });
    
    if (!res.ok || res.data?._err) {
      // Return mock guardrails if executor unavailable
      return NextResponse.json({
        thresholds: {
          maxDrawdown: 0.15,
          minSharpe: 1.0,
          maxLeverage: 3.0,
          minWinRate: 0.45
        },
        weights: {
          sharpe: 0.4,
          drawdown: 0.3,
          winRate: 0.2,
          profitFactor: 0.1
        },
        lastBreach: null,
        _mock: true,
        _err: res.data?._err
      }, { status: 200 });
    }
    
    return NextResponse.json(res.data, { status: 200 });
  } catch (e: any) {
    // Return mock data on error
    return NextResponse.json({
      thresholds: {
        maxDrawdown: 0.15,
        minSharpe: 1.0,
        maxLeverage: 3.0,
        minWinRate: 0.45
      },
      weights: {
        sharpe: 0.4,
        drawdown: 0.3,
        winRate: 0.2,
        profitFactor: 0.1
      },
      lastBreach: null,
      _mock: true,
      _err: `executor-unavailable: ${e?.message ?? "connection-failed"}`
    }, { status: 200 });
  }
}

