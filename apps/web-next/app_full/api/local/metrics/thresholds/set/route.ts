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
    
    // Sadece ADMIN threshold ekleyebilir
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "forbidden", message: "Bu işlem için ADMIN yetkisi gerekiyor" }, { status: 403 });
    }

    const body = await req.json();
    const { name, op, value, severity, enabled = true } = body;

    if (!name || !op || typeof value !== 'number' || !severity) {
      return NextResponse.json({ ok: false, error: "invalid_request", message: "Eksik parametreler" }, { status: 400 });
    }

    const prisma = getPrisma();

    // Upsert threshold
    const threshold = await prisma.metricsThreshold.upsert({
      where: { name },
      update: { op, value, severity, enabled, updatedAt: new Date() },
      create: { name, op, value, severity, enabled }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actor: payload.email,
        role: payload.role,
        action: "metrics.threshold.set",
        details: {
          thresholdId: threshold.id,
          name: threshold.name,
          op: threshold.op,
          value: threshold.value,
          severity: threshold.severity,
          enabled: threshold.enabled
        }
      }
    });

    return NextResponse.json({
      ok: true,
      threshold
    });
  } catch (error) {
    console.error("Threshold set error:", error);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
} 