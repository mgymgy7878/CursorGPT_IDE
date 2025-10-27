import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";
import { getPrisma } from "@spark/db";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Sadece ADMIN kullanıcılar audit log'ları görebilir
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "forbidden", message: "Bu işlem için ADMIN yetkisi gerekiyor" }, { status: 403 });
    }

    // URL parametrelerini al
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // AuditLog kayıtlarını çek
    const logs = await getPrisma().auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actor: true,
        role: true,
        action: true,
        details: true,
        createdAt: true
      }
    });

    // Toplam kayıt sayısını al
    const total = await getPrisma().auditLog.count();

    metrics.incAuditUiQueries();

    return NextResponse.json({ 
      ok: true, 
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
} 