// apps/web-next/app/api/public/btcturk/ticker/route.ts
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "BTCTRY";
  const url = `https://api.btcturk.com/api/v2/ticker?pairSymbol=${symbol}`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    
    // Stream JSON response to avoid parse overhead
    const text = await r.text();
    return new NextResponse(text, { 
      status: r.status, 
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      } 
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
