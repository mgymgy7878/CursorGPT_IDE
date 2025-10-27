import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { extractBearer, verifyToken, isDevAuth } from "@spark/auth";
import { audit, enforceRateLimit } from "@spark/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

declare global {
  // eslint-disable-next-line no-var
  var __sparkPendingBracket: Record<string, any> | undefined;
  // eslint-disable-next-line no-var
  var __sparkRiskThresholds: any | undefined;
  // eslint-disable-next-line no-var
  var __sparkKillSwitch: boolean | undefined;
}

type BracketParams = {
  symbol: string;
  side: "BUY" | "SELL";
  notionalUSDT: number;
  leverage?: number;
  interval?: string;
  atr_period?: number;
  sl_atr?: number;
  tp_atr?: number;
  reduceOnly?: boolean;
};

function toNum(x: unknown, d = 0) { const n = Number(x); return Number.isFinite(n) ? n : d; }

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, data: text }; }
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0] ?? 0;
  out.push(prev);
  for (let i = 1; i < values.length; i++) { prev = values[i] * k + prev * (1 - k); out.push(prev); }
  return out;
}
function atr(high: number[], low: number[], close: number[], period: number): number[] {
  const tr: number[] = [];
  for (let i = 0; i < close.length; i++) {
    const prevClose = i === 0 ? close[0] : close[i - 1];
    tr.push(Math.max(high[i] - low[i], Math.abs(high[i] - prevClose), Math.abs(low[i] - prevClose)));
  }
  return ema(tr, period);
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

function sign(query: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

async function binanceSigned(method: "GET" | "POST", base: string, path: string, apiKey: string, secret: string, params: Record<string, any>) {
  const ts = Date.now();
  const query = qs({ ...params, timestamp: ts, recvWindow: 5000 });
  const sig = sign(query, secret);
  const url = `${base}${path}?${query}&signature=${sig}`;
  const res = await fetch(url, { method, headers: { "X-MBX-APIKEY": apiKey } });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function executeBracket(params: BracketParams): Promise<{ ok: boolean; report: any }> {
  const testnet = (process.env.BINANCE_FUTURES_TESTNET ?? "0") === "1";
  const base = testnet ? "https://testnet.binancefuture.com" : "https://fapi.binance.com";
  const apiKey = process.env.BINANCE_API_KEY ?? "";
  const apiSecret = process.env.BINANCE_API_SECRET ?? "";
  const interval = params.interval ?? "1m";
  const atrPeriod = Math.max(3, toNum(params.atr_period, 14));
  const slMult = Math.max(0.1, toNum(params.sl_atr, 1.5));
  const tpMult = Math.max(0.1, toNum(params.tp_atr, 2.0));

  // price for qty calc
  const pxRes = await fetchJson(`${base}/fapi/v1/ticker/price?symbol=${params.symbol}`);
  if (!pxRes.ok) return { ok: false, report: { step: "price", error: pxRes } } as any;
  const lastPrice = toNum((pxRes.data as any)?.price, 0);
  if (!lastPrice) return { ok: false, report: { step: "price", error: "NO_PRICE" } } as any;

  // ATR for bracket levels
  const kl = await fetchJson(`${base}/fapi/v1/klines?symbol=${params.symbol}&interval=${interval}&limit=${Math.max(atrPeriod + 5, 20)}`);
  let atrVal = 0;
  if (kl.ok && Array.isArray(kl.data) && kl.data.length > 0) {
    const high = (kl.data as any[]).map(r => +r[2]);
    const low  = (kl.data as any[]).map(r => +r[3]);
    const close= (kl.data as any[]).map(r => +r[4]);
    const arr = atr(high, low, close, atrPeriod);
    atrVal = arr[arr.length - 1] ?? 0;
  }

  // quantity approximation
  const qtyRaw = params.notionalUSDT / lastPrice;
  const quantity = Number(qtyRaw.toFixed(3)); // coarse step

  // desired leverage
  const leverage = Math.max(1, Math.min(125, toNum(params.leverage, 5)));

  const t0 = performance.now();
  const lev = await binanceSigned("POST", base, "/fapi/v1/leverage", apiKey, apiSecret, { symbol: params.symbol, leverage });
  const t1 = performance.now();
  const entry = await binanceSigned("POST", base, "/fapi/v1/order", apiKey, apiSecret, {
    symbol: params.symbol,
    side: params.side,
    type: "MARKET",
    quantity,
    reduceOnly: params.reduceOnly ? true : undefined,
    newOrderRespType: "RESULT"
  });
  const t2 = performance.now();

  const sideExit = params.side === "BUY" ? "SELL" : "BUY";
  const stopPrice = params.side === "BUY" ? (lastPrice - slMult * atrVal) : (lastPrice + slMult * atrVal);
  const takePrice = params.side === "BUY" ? (lastPrice + tpMult * atrVal) : (lastPrice - tpMult * atrVal);

  const sl = await binanceSigned("POST", base, "/fapi/v1/order", apiKey, apiSecret, {
    symbol: params.symbol,
    side: sideExit,
    type: "STOP_MARKET",
    stopPrice: Number(stopPrice.toFixed(2)),
    closePosition: true,
    timeInForce: "GTC"
  });
  const t3 = performance.now();
  const tp = await binanceSigned("POST", base, "/fapi/v1/order", apiKey, apiSecret, {
    symbol: params.symbol,
    side: sideExit,
    type: "TAKE_PROFIT_MARKET",
    stopPrice: Number(takePrice.toFixed(2)),
    closePosition: true,
    timeInForce: "GTC"
  });
  const t4 = performance.now();

  return {
    ok: Boolean(lev.ok && entry.ok && sl.ok && tp.ok),
    report: {
      testnet,
      lastPrice,
      quantity,
      leverage,
      atr: atrVal,
      stopPrice: Number(stopPrice.toFixed(2)),
      takePrice: Number(takePrice.toFixed(2)),
      timings_ms: { leverage_ack: +(t1 - t0).toFixed(2), entry_ack: +(t2 - t1).toFixed(2), sl_ack: +(t3 - t2).toFixed(2), tp_ack: +(t4 - t3).toFixed(2) },
      entry, sl, tp
    }
  };
}

export async function POST(req: NextRequest) {
  const timestamp = Date.now();
  const token = extractBearer(req.headers.get("authorization"));
  const auth = verifyToken(token || "");
  const isAdmin = (auth.ok && (auth as any).payload?.role === "admin") || isDevAuth(token || "");
  if (!isAdmin) return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const rate = enforceRateLimit(undefined, 1);
  if (!rate.ok) return NextResponse.json({ error: "Rate limited", retryAfterMs: rate.retryAfterMs }, { status: 429 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const params: BracketParams = (body?.params ?? body) as BracketParams;
  const confirmRequired = Boolean(body?.confirm_required ?? true);
  const dryRun = Boolean(body?.dryRun ?? false);

  // Kill-switch & risk thresholds
  if ((globalThis as any).__sparkKillSwitch) {
    return NextResponse.json({ ok: false, error: "KILL_SWITCH_ACTIVE" }, { status: 400 });
  }
  const th = (globalThis as any).__sparkRiskThresholds ?? { maxNotionalPerTradeUSDT: 200, maxLeverage: 5, maxDailyDrawdownPct: 3, requireStopLoss: true, killSwitch: true };
  if (toNum(params.notionalUSDT) > toNum(th.maxNotionalPerTradeUSDT, 200)) {
    return NextResponse.json({ ok: false, error: "MAX_NOTIONAL_EXCEEDED", max: th.maxNotionalPerTradeUSDT }, { status: 400 });
  }
  if (toNum(params.leverage, 5) > toNum(th.maxLeverage, 5)) {
    return NextResponse.json({ ok: false, error: "MAX_LEVERAGE_EXCEEDED", max: th.maxLeverage }, { status: 400 });
  }

  // Pending flow
  if (!dryRun && confirmRequired) {
    const confirm_token = `live_${timestamp}_${Math.random().toString(36).slice(2,8)}`;
    if (!(globalThis as any).__sparkPendingBracket) (globalThis as any).__sparkPendingBracket = {};
    (globalThis as any).__sparkPendingBracket[confirm_token] = { params, requestedAt: timestamp };
    const keys = Object.keys((globalThis as any).__sparkPendingBracket);
    audit({ type: "live_bracket_pending", data: { confirm_token, symbol: params.symbol, side: params.side, notional: params.notionalUSDT }, ts: timestamp });
    return NextResponse.json({ pending: true, confirm_token, pending_count: keys.length, pending_tails: keys.map(k=>k.slice(-6)).slice(0,5), timestamp });
  }

  // Execute
  try {
    // If dev token and missing creds, simulate
    if (isDevAuth(token || "") && (!process.env.BINANCE_API_KEY || !process.env.BINANCE_API_SECRET)) {
      const t0 = performance.now();
      await new Promise(r => setTimeout(r, 80));
      const t1 = performance.now();
      await new Promise(r => setTimeout(r, 50));
      const t2 = performance.now();
      await new Promise(r => setTimeout(r, 40));
      const t3 = performance.now();
      const t4 = performance.now();
      const sim = { timings_ms: { leverage_ack: +(t1-t0).toFixed(2), entry_ack: +(t2-t1).toFixed(2), sl_ack: +(t3-t2).toFixed(2), tp_ack: +(t4-t3).toFixed(2) } };
      audit({ type: "live_bracket_simulated", data: { symbol: params.symbol, side: params.side, notional: params.notionalUSDT }, ts: timestamp });
      return NextResponse.json({ ok: true, simulated: true, data: sim, timestamp });
    }
    const exec = await executeBracket(params);
    audit({ type: "live_bracket_executed", data: { symbol: params.symbol, side: params.side, notional: params.notionalUSDT, ok: exec.ok }, ts: timestamp });
    return NextResponse.json({ ok: exec.ok, data: exec.report, timestamp });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "BRACKET_EXEC_ERROR", message: e?.message }, { status: 500 });
  }
}


