// runtime: nodejs
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function baseUrl(): string {
  return process.env.BINANCE_FUTURES_TESTNET === "1"
    ? "https://testnet.binancefuture.com"
    : "https://fapi.binance.com";
}
function sign(query: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

export async function POST() {
  const key = process.env.BINANCE_API_KEY || "";
  const sec = process.env.BINANCE_API_SECRET || "";
  if (!key || !sec) {
    return NextResponse.json({ ok:false, error:"MISSING_API_KEYS" }, { status:400 });
  }
  const ts = Date.now();
  const q = `timestamp=${ts}&recvWindow=5000`;
  const sig = sign(q, sec);
  const url = `${baseUrl()}/fapi/v2/balance?${q}&signature=${sig}`;

  const r = await fetch(url, { headers: { "X-MBX-APIKEY": key }, cache: "no-store" });
  const status = r.status;
  const json = await r.json().catch(() => ({}));
  if (status !== 200) {
    return NextResponse.json({ ok:false, status, error:"AUTH_FAILED", detail:json }, { status:401 });
  }
  return NextResponse.json({ ok:true, kind:"signed", base:baseUrl(), assets: Array.isArray(json) ? json.map((x:any)=>({ a:x.asset, wb:x.walletBalance })) : [] });
}


