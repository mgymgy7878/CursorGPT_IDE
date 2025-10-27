import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || process.env.NEXT_PUBLIC_EQUITY_DEFAULT || "ISCTR.E";
  const base = 100 + (symbol.length % 7);
  const bid = +(base + Math.random()).toFixed(2);
  const ask = +(bid + 0.03).toFixed(2);
  const last = +((bid + ask) / 2).toFixed(2);
  return NextResponse.json({ bid, ask, last, ts: Date.now(), mode: "mock" }, { headers: { "Cache-Control": "no-store" } });
}


