import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ ok: true, jobId: Math.random().toString(36).slice(2) });
}
