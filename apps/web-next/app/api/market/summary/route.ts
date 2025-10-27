import { NextResponse } from "next/server";

// Binance 24h endpoint (public, CORS server-side safe)
const SYMBOLS = ["BTCUSDT","ETHUSDT","BNBUSDT","USDTTRY"];

export async function GET() {
  try {
    const url = "https://api.binance.com/api/v3/ticker/24hr";
    const qs  = "?symbols=" + encodeURIComponent(JSON.stringify(SYMBOLS));
    const r   = await fetch(url + qs, { next: { revalidate: 15 }});
    if (!r.ok) return NextResponse.json({ ok:false, reason:"binance_error" }, { status: 502 });
    const data = await r.json();
    const out = data.map((d:any)=>({
      s: d.symbol,
      p: Number(d.lastPrice),
      ch: Number(d.priceChangePercent),
      h: Number(d.highPrice),
      l: Number(d.lowPrice),
      v: Number(d.volume)
    }));
    return NextResponse.json({ ok:true, symbols: out });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e) }, { status: 500 });
  }
}
