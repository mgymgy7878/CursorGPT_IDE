import { NextRequest, NextResponse } from "next/server";
import { readCookie, verifyToken } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const token = readCookie(request);
    if (!token) {
      return NextResponse.json({ ok: false, error: "no_token" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    return NextResponse.json({ 
      ok: true, 
      user: { email: payload.email, role: payload.role }
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "invalid_token", message: error.message },
      { status: 401 }
    );
  }
} 