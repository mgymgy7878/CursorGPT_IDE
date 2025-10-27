import { NextRequest, NextResponse } from "next/server";
import { extractBearer, verifyToken, isDevAuth } from "@spark/auth";
import { setAuthCookie } from "../../../../lib/auth/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(body: unknown, init?: number | ResponseInit) {
  const status = typeof init === "number" ? init : init?.status ?? 200;
  return NextResponse.json(body, { status, ...(typeof init === "object" ? init : {}) });
}

export async function POST(req: NextRequest) {
  // 1) Önce Authorization: Bearer kontrolü
  let token = extractBearer(req.headers.get("authorization"));

  // 2) Yoksa mevcut cookie’den oku (middleware de bunu yapıyor)
  if (!token) {
    const cname = process.env.AUTH_COOKIE_NAME || "auth_token";
    token = req.cookies.get(cname)?.value || null;
  }

  if (!token) {
    // Idempotent: token yoksa sessizce no-op
    return ok({ ok: true, refreshed: false, exp: null });
  }

  try {
    const claims = verifyToken(token);
    // DEV_AUTH açık olsa da gerçek token doğrulanabildi; cookie’yi yeniden yaz
    setAuthCookie(token);
    return ok({ ok: true, refreshed: true, exp: claims?.exp ?? null });
  } catch {
    // Geçersiz/expired ise no-op (idempotent davranış)
    return ok({ ok: true, refreshed: false, exp: null });
  }
} 
