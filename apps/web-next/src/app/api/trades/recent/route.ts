import { NextResponse } from "next/server";
import { EXECUTOR_BASE } from "@/lib/spark/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exchange = searchParams.get("exchange") || undefined;
  const symbol = searchParams.get("symbol") || undefined;
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const executorUrl = new URL(`${EXECUTOR_BASE}/v1/trades/recent`);
    if (exchange) executorUrl.searchParams.set("exchange", exchange);
    if (symbol) executorUrl.searchParams.set("symbol", symbol);
    executorUrl.searchParams.set("limit", limit.toString());

    const response = await fetch(executorUrl.toString(), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.data) {
        return NextResponse.json({
          trades: data.data,
          count: data.count || data.data.length,
          limit: data.limit,
          _mock: false,
        }, { status: 200 });
      }
    }

    return NextResponse.json({
      trades: [],
      count: 0,
      _err: `Executor error: ${response.statusText}`,
      _mock: true
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({
      trades: [],
      count: 0,
      _err: `Executor unavailable: ${e?.message ?? "connection-failed"}`,
      _mock: true
    }, { status: 200 });
  }
}

