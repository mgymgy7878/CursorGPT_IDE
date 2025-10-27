// runtime: nodejs
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Basit EMA hesaplayıcı */
function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0] ?? 0;
  out.push(prev);
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/** Basit ATR hesaplayıcı (EMA tabanlı) */
function atr(high: number[], low: number[], close: number[], period: number): number[] {
  const tr: number[] = [];
  for (let i = 0; i < close.length; i++) {
    const prevClose = i === 0 ? close[0] : close[i - 1];
    tr.push(Math.max(high[i] - low[i], Math.abs(high[i] - prevClose), Math.abs(low[i] - prevClose)));
  }
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = tr[0] ?? 0;
  out.push(prev);
  for (let i = 1; i < tr.length; i++) {
    prev = tr[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const symbol = String((body.symbol ?? "BTCUSDT")).toUpperCase();
  const interval = body.interval ?? "1m";
  const limit = Math.min(body.limit ?? 1000, 1000);
  const strat = body.strategy ?? { name: "ema_atr_v1", ema_fast: 9, ema_slow: 21, atr: 14, sl_atr: 1.5, tp_atr: 2 };

  try {
    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "BINANCE_FETCH_FAILED", status: res.status }, { status: 502 });
    }
    const rows: any[] = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: false, error: "NO_DATA" }, { status: 502 });
    }
    const open: number[] = rows.map(r => +r[1]);
    const high: number[] = rows.map(r => +r[2]);
    const low: number[]  = rows.map(r => +r[3]);
    const close: number[] = rows.map(r => +r[4]);

    const emaF = ema(close, strat.ema_fast ?? 9);
    const emaS = ema(close, strat.ema_slow ?? 21);
    const atrArr = atr(high, low, close, strat.atr ?? 14);

    const fee = body.fee ?? 0.0004; // tek yön ~0.04%
    let pos = 0; // 0 flat, 1 long
    let entry = 0;
    let equity = 1; // normalize (1=100%)
    let peak = 1;
    let mdd = 0;
    let wins = 0, losses = 0, trades = 0;

    for (let i = 2; i < close.length; i++) {
      const price = close[i];
      const wantLong = emaF[i] > emaS[i];
      const stop = (strat.sl_atr ?? 1.5) * atrArr[i];
      const tp   = (strat.tp_atr ?? 2.0) * atrArr[i];

      if (pos === 0 && wantLong) {
        pos = 1; entry = price * (1 + fee); trades++;
      } else if (pos === 1) {
        const hitSL = price <= entry - stop;
        const hitTP = price >= entry + tp;
        if (!wantLong || hitSL || hitTP) {
          const exitPrice = price * (1 - fee);
          const ret = (exitPrice - entry) / entry;
          equity *= (1 + ret);
          if (ret >= 0) wins++; else losses++;
          peak = Math.max(peak, equity);
          mdd = Math.max(mdd, (peak - equity) / peak);
          pos = 0; entry = 0;
        }
      }
    }

    const winrate = trades ? wins / trades : 0;
    const pnlPct = (equity - 1) * 100;
    const sharpe = (pnlPct / 100) / (mdd || 1e-6);

    return NextResponse.json({
      ok: true,
      symbol, interval, candles: close.length,
      metrics: { trades, winrate, pnlPct, mdd, sharpe },
      strategy: strat
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "BACKTEST_ERROR", message: (e as any)?.message }, { status: 500 });
  }
}


