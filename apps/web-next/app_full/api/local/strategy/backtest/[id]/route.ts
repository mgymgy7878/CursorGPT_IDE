import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    await verifyToken(token); // Tüm roller detay görebilir
    
    const { id } = params;
    
    // Executor'a proxy
    const executorUrl = process.env.EXECUTOR_ORIGIN || "http://127.0.0.1:4001";
    const response = await fetch(`${executorUrl}/api/public/strategy/backtest/${id}`, {
      method: "GET",
      headers: { "content-type": "application/json" }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Backtest detail proxy error:", error);
    return NextResponse.json({ ok: false, error: "proxy_error" }, { status: 500 });
  }
} 