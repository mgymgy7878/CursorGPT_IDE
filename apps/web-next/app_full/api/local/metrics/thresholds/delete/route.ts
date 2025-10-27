import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";
import { getPrisma } from "@spark/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Sadece ADMIN threshold silebilir
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "forbidden", message: "Bu işlem için ADMIN yetkisi gerekiyor" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "invalid_request", message: "Threshold ID gerekli" }, { status: 400 });
    }

    const prisma = getPrisma();

    // Threshold'u bul ve sil
    const threshold = await prisma.metricsThreshold.findUnique({
      where: { id }
    });

    if (!threshold) {
      return NextResponse.json({ ok: false, error: "not_found", message: "Threshold bulunamadı" }, { status: 404 });
    }

    await prisma.metricsThreshold.delete({
      where: { id }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actor: payload.email,
        role: payload.role,
        action: "metrics.threshold.delete",
        details: {
          thresholdId: threshold.id,
          name: threshold.name,
          op: threshold.op,
          value: threshold.value,
          severity: threshold.severity
        }
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Threshold silindi"
    });
  } catch (error) {
    console.error("Threshold delete error:", error);
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
} 