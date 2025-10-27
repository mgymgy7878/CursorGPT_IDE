// runtime: nodejs
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function baseUrl(): string {
  return process.env.BINANCE_FUTURES_TESTNET === "1"
    ? "https://testnet.binancefuture.com"
    : "https://fapi.binance.com";
}

export async function POST() {
  const url = `${baseUrl()}/fapi/v1/time`;
  const t0 = Date.now();
  const r = await fetch(url, { cache: "no-store" });
  const t1 = Date.now();
  if (!r.ok) return NextResponse.json({ ok:false, status:r.status }, { status:502 });
  const data = await r.json();
  return NextResponse.json({ ok:true, kind:"public", base:baseUrl(), serverTime:data.serverTime, rtt_ms:t1-t0 });
}


