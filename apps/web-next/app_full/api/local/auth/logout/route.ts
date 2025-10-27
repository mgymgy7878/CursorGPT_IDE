import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/auth-server";

export async function POST() {
  try {
    clearCookie();
    return NextResponse.json({ ok: true, message: "Logged out successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "logout_failed", message: error.message },
      { status: 500 }
    );
  }
} 