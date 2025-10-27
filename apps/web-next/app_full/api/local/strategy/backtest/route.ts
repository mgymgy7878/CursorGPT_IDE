import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Sadece ADMIN ve TRADER backtest çalıştırabilir
    if (!["ADMIN", "TRADER"].includes(payload.role)) {
      return NextResponse.json({ ok: false, error: "forbidden", message: "Bu işlem için ADMIN veya TRADER yetkisi gerekiyor" }, { status: 403 });
    }

    const body = await req.json();
    
    // Executor'a proxy
    const executorUrl = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
    const response = await fetch(`${executorUrl}/api/public/strategy/backtest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (response.ok) {
      metrics.incBacktestRuns();
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Backtest proxy error:", error);
    return NextResponse.json({ ok: false, error: "proxy_error" }, { status: 500 });
  }
} 