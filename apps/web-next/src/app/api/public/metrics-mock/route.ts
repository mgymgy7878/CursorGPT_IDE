import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ p95_ms: 720, staleness_s: 3, error_rate: 0.0 });
}
