import { NextResponse } from "next/server";
const B = process.env.EXECUTOR_BASE_URL;

export async function GET() {
  if (!B) {
    const now = Date.now();
    return NextResponse.json([
      { id:"s2", name:"RSI Mean Revert", symbol:"ETHUSDT", status:"running",
        createdAt:new Date(now-86400000).toISOString(),
        startedAt:new Date(now-3600000).toISOString(), pnl: 142.7, trades: 18, latencyMs: 5.2 },
      { id:"s3", name:"SMA Cross", symbol:"BTCUSDT", status:"running",
        createdAt:new Date(now-172800000).toISOString(),
        startedAt:new Date(now-5400000).toISOString(), pnl: -38.1, trades: 9, latencyMs: 4.7 },
    ]);
  }
  const r = await fetch(`${B}/api/strategies/running`, { cache: "no-store" });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
