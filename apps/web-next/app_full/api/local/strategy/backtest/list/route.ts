import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    await verifyToken(token); // Tüm roller liste görebilir
    
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    
    // Executor'a proxy
    const executorUrl = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
    const queryParams = new URLSearchParams();
    if (symbol) queryParams.append("symbol", symbol);
    if (limit) queryParams.append("limit", limit);
    if (offset) queryParams.append("offset", offset);
    
    const response = await fetch(`${executorUrl}/api/public/strategy/backtest/list?${queryParams}`, {
      method: "GET",
      headers: { "content-type": "application/json" }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Backtest list proxy error:", error);
    return NextResponse.json({ ok: false, error: "proxy_error" }, { status: 500 });
  }
} 