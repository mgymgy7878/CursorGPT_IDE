import { NextRequest, NextResponse } from "next/server";
import { extractBearer, verifyToken, isDevAuth } from "@spark/auth";
import { setAuthCookie, clearAuthCookie } from "../../../../lib/auth/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

export async function POST(req: NextRequest) {
  let token = extractBearer(req.headers.get("authorization"));
  if (!token && isDevAuth()) {
    try {
      const body = await req.json().catch(() => ({} as any));
      if (body?.token && typeof body.token === "string") token = body.token;
    } catch {}
  }
  if (!token) return bad("Missing token", 400);

  try {
    verifyToken(token);
    setAuthCookie(token);
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Invalid token", 401);
  }
}

export async function DELETE() {
  clearAuthCookie();
  return NextResponse.json({ ok: true });
} 
