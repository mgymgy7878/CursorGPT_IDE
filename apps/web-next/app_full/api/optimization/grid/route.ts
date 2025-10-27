// runtime: nodejs
import { NextResponse } from "next/server";
import { POST as backtest } from "../../backtest/run/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const symbol = String((body.symbol ?? "BTCUSDT")).toUpperCase();
  const interval = body.interval ?? "1m";
  const fast = Array.isArray(body.fast) ? body.fast : [7,9,12];
  const slow = Array.isArray(body.slow) ? body.slow : [21,26,30];
  const sls  = Array.isArray(body.sl_atr) ? body.sl_atr : [1.3,1.5,1.8];
  const tps  = Array.isArray(body.tp_atr) ? body.tp_atr : [1.8,2.0,2.5];

  const cap = Math.min(fast.length * slow.length * sls.length * tps.length, 60);
  const combos: any[] = [];
  for (const f of fast) for (const s of slow) for (const sl of sls) for (const tp of tps) {
    if (combos.length >= cap) break;
    combos.push({ ema_fast: Number(f), ema_slow: Number(s), atr: 14, sl_atr: Number(sl), tp_atr: Number(tp) });
  }

  const results: any[] = [];
  for (const strat of combos) {
    const resp = await backtest(new Request("http://local", { method: "POST", body: JSON.stringify({ symbol, interval, limit: 1000, strategy: strat }) })) as any;
    try {
      const json = await resp.json();
      if (json?.ok) results.push({ strat, metrics: json.metrics });
    } catch {}
  }

  results.sort((a,b) => (b.metrics.sharpe - a.metrics.sharpe));
  return NextResponse.json({ ok: true, symbol, interval, tested: results.length, top5: results.slice(0,5) });
}


