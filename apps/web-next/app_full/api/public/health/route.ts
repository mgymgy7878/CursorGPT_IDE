export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

const BASE = process.env.EXECUTOR_BASE ?? "http://127.0.0.1:4001";

type H = "GREEN" | "YELLOW" | "RED";

function mapStatus(code: number, body: any): H {
  const raw = (body?.status || body?.state || body?.health || "").toString().toUpperCase();
  if (raw === "GREEN" || raw === "YELLOW" || raw === "RED") return raw as H;
  if (code >= 200 && code < 300) return "GREEN";
  if (code >= 500) return "RED";
  return "YELLOW";
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    status: 200,
  });
}