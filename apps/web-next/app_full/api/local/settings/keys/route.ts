import { NextResponse } from "next/server";
import { listMasked } from "@/lib/vault";
export const dynamic = "force-dynamic";
export async function GET() {
  const data = listMasked();
  return NextResponse.json({ ok: true, keys: data, warning: process.env.SETTINGS_MASTER_KEY ? null : "in-memory vault (no SETTINGS_MASTER_KEY)" });
} 