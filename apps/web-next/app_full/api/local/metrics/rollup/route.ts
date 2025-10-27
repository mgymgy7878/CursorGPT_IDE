import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";
import { runMetricsRollup } from "@/lib/rollup";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Sadece ADMIN rollup çalıştırabilir
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "forbidden", message: "Bu işlem için ADMIN yetkisi gerekiyor" }, { status: 403 });
    }

    const result = await runMetricsRollup();

    return NextResponse.json({
      ok: true,
      inserted: result.inserted,
      events: result.events
    });
  } catch (error) {
    console.error("Metrics rollup API error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "rollup_failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 