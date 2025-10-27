import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth";
import { setKey } from "@/lib/vault";
import { getPrisma } from "@spark/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = readCookie(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Sadece ADMIN kullanıcılar settings değiştirebilir
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "forbidden", message: "Bu işlem için ADMIN yetkisi gerekiyor" }, { status: 403 });
    }

    const { name, value } = await req.json().catch(() => ({}));
    if (!name || typeof value !== "string") {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }

    setKey(name, value);
    
    // AuditLog'a kaydet
    await getPrisma().auditLog.create({ 
      data: { 
        actor: payload.email, 
        role: payload.role,
        action: "settings.set", 
        details: { name, masked: true } 
      } 
    });

    return NextResponse.json({ ok: true, name });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
} 