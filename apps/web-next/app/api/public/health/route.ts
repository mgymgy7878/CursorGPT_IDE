// apps/web-next/app/api/public/health/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      service: "web-next",
      now: Date.now(),
      runtime: "nodejs",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}