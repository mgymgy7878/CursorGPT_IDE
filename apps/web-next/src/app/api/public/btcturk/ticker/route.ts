import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Input validation: BTCTRY, ETHUSDT, vb.
const SYMBOL_REGEX = /^[A-Z]{2,10}$/;
const DEFAULT_BASE = process.env.BTCTURK_BASE_URL ?? "https://api.btcturk.com/api/v2";

/**
 * GET /api/public/btcturk/ticker?symbol=BTCTRY
 * Proxy to BTCTurk public ticker API
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbol = (url.searchParams.get("symbol") || "").toUpperCase();

    // Input validation
    if (!SYMBOL_REGEX.test(symbol)) {
      return NextResponse.json(
        { error: "invalid_symbol", detail: "Symbol must be 2-10 uppercase letters" },
        { status: 400 }
      );
    }

    // Fetch from BTCTurk public API
    const upstream = `${DEFAULT_BASE}/ticker?pairSymbol=${symbol}`;
    
    const r = await fetch(upstream, {
      // Short cache for better UX
      next: { revalidate: 5 },
      headers: {
        'User-Agent': 'Spark-Trading-Platform/1.0'
      },
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: "upstream_failed", status: r.status, symbol },
        { status: 502 }
      );
    }

    const data = await r.json();
    
    return NextResponse.json(
      {
        ok: true,
        symbol,
        data,
        source: "btcturk",
        timestamp: Date.now()
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10'
        }
      }
    );
  } catch (err: any) {
    // Log error but don't expose internals
    console.error('[BTCTurk Ticker Proxy] Error:', err.message);
    
    return NextResponse.json(
      {
        error: "unexpected",
        detail: err.name === 'TimeoutError' ? 'Request timeout' : 'Internal error'
      },
      { status: 500 }
    );
  }
}

