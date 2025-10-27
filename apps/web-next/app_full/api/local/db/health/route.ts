import { NextResponse } from "next/server";
import { getPrisma } from "@spark/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, db: "down", error: e?.message || "db_error" }, { status: 500 });
  }
} 