import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";
import { getPrisma } from "@spark/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Sadece ADMIN threshold'ları görebilir
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "forbidden", message: "Bu işlem için ADMIN yetkisi gerekiyor" }, { status: 403 });
    }

    const thresholds = await getPrisma().metricsThreshold.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      ok: true,
      thresholds
    });
  } catch (error) {
    console.error("Threshold list error:", error);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
} 