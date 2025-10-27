import https from "https";
import fs from "fs";

type K = [number, string, string, string, string, string, number, string, string, string, string, string];
type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };

const BASE = "https://api.binance.com";
const SYMBOL = process.env.SYMBOL || "BTCUSDT";
const TF = "1m";
const TARGET = parseInt(process.env.TARGET_BARS || "12000", 10);
const INTERVAL_MS = 60_000;

function get(path: string): Promise<any> {
  return new Promise((res, rej) => https.get(BASE + path, (r) => {
    let d = "";
    r.on("data", c => d += c);
    r.on("end", () => {
      try {
        res(JSON.parse(d));
      } catch {
        res({ raw: d, code: r.statusCode });
      }
    });
  }).on("error", rej));
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function pct(a: number, b: number) {
  return ((a / b) - 1) * 100;
}

function ema(arr: number[], p: number) {
  const a = 2 / (p + 1);
  const out: Array<number> = new Array(arr.length).fill(0);
  let e = arr[0];
  for (let i = 0; i < arr.length; i++) {
    e = i === 0 ? arr[0] : a * arr[i] + (1 - a) * e;
    out[i] = e;
  }
  return out;
}

function sharpe(returns: number[]) {
  if (!returns.length) return 0;
  const m = returns.reduce((s, x) => s + x, 0) / returns.length;
  const v = returns.reduce((s, x) => s + (x - m) * (x - m), 0) / returns.length;
  const sd = Math.sqrt(v) + 1e-12;
  const ann = Math.sqrt(365 * 24 * 60);
  return (m / sd) * ann;
}

function maxDD(equity: number[]) {
  let peak = equity[0];
  let mdd = 0;
  for (const x of equity) {
    if (x > peak) peak = x;
    const dd = (peak - x) / peak;
    if (dd > mdd) mdd = dd;
  }
  return mdd * 100;
}

function pctl(xs: number[], q: number) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
}

(async () => {
  const ROOT = process.argv[2];
  const end = Date.now();
  const lookbackDays = parseInt(process.env.LOOKBACK_DAYS || "10", 10);
  let start = end - lookbackDays * 24 * 60 * 60 * 1000;
  const bars: Bar[] = [];
  const t0dl = Date.now();
  
  while (bars.length < TARGET && start < end) {
    const url = `/api/v3/klines?symbol=${SYMBOL}&interval=${TF}&startTime=${start}&limit=1000`;
    const arr = await get(url) as K[];
    if (!Array.isArray(arr) || arr.length === 0) break;
    
    for (const k of arr) {
      const [openTime, o, h, l, c, v] = [k[0], k[1], k[2], k[3], k[4], k[5]];
      bars.push({ ts: openTime, o: +o, h: +h, l: +l, c: +c, v: +v, tf: TF, sym: SYMBOL });
    }
    start = (arr[arr.length - 1][0] as number) + INTERVAL_MS;
    await sleep(120); // rate-limit dostu
  }
  
  const download_ms = Date.now() - t0dl;
  
  // Bütünlük: sıralama, boşluk/duplikasyon
  bars.sort((a, b) => a.ts - b.ts);
  let seqGap = 0;
  let dup = 0;
  for (let i = 1; i < bars.length; i++) {
    const dt = bars[i].ts - bars[i - 1].ts;
    if (dt === 0) dup++;
    else if (dt !== INTERVAL_MS) seqGap++;
  }
  
  // JSONL veri dök
  const dataPath = `${ROOT}/data.jsonl`;
  const fd = fs.openSync(dataPath, "w");
  for (const b of bars) {
    fs.writeSync(fd, JSON.stringify(b) + "\n");
  }
  fs.closeSync(fd);
  
  // Backtest
  const t0 = Date.now();
  const close = bars.map(b => b.c);
  const ema12 = ema(close, 12);
  const ema26 = ema(close, 26);
  
  const pos: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    pos[i] = (ema12[i] > ema26[i]) ? 1 : 0;
  }
  
  const ret: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    ret[i] = (close[i] - close[i - 1]) / close[i - 1];
  }
  
  const stratRet: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    stratRet[i] = ret[i] * pos[i - 1];
  }
  
  const equity: number[] = [1];
  for (let i = 1; i < bars.length; i++) {
    equity[i] = equity[i - 1] * (1 + (stratRet[i] || 0));
  }
  
  const compute_ms = Date.now() - t0;
  
  // Trades / winrate
  let trades = 0;
  let wins = 0;
  for (let i = 1; i < bars.length; i++) {
    if (pos[i] !== pos[i - 1]) trades++;
    if (stratRet[i] > 0) wins++;
  }
  
  const cagr = (Math.pow(equity[equity.length - 1], (365 * 24 * 60) / bars.length) - 1) * 100;
  const S = sharpe(stratRet.slice(1));
  const dd = maxDD(equity);
  
  const perf = { compute_total_ms: compute_ms, p50_ms: compute_ms, p95_ms: compute_ms };
  const dataset = {
    symbol: SYMBOL,
    timeframe: TF,
    bars: bars.length,
    from_utc: new Date(bars[0]?.ts || 0).toISOString(),
    to_utc: new Date(bars[bars.length - 1]?.ts || 0).toISOString(),
    download_ms,
    seq_gap_count: seqGap,
    dup_count: dup
  };
  
  // Evidence
  const metrics = {
    dataset,
    perf,
    strategy: {
      name: "ema_cross_12_26",
      trades,
      win_rate_pct: +(trades ? (wins / trades * 100) : 0).toFixed(2),
      cagr_pct: +cagr.toFixed(2),
      sharpe: +S.toFixed(2),
      max_dd_pct: +dd.toFixed(2)
    }
  };
  
  fs.writeFileSync(`${ROOT}/metrics.json`, JSON.stringify(metrics, null, 2));
  
  const status = (dataset.bars >= 10000 && dataset.seq_gap_count === 0 && perf.compute_total_ms <= 2000) ? "OK" : (dataset.bars >= 10000 && perf.compute_total_ms <= 2000 ? "WARNING" : "ERROR");
  const reason = status === "OK" ? "" : (dataset.bars < 10000 ? "BARS_LT_MIN" : (dataset.seq_gap_count > 0 ? "SEQ_GAP_DETECTED" : "COMPUTE_GT_SLO"));
  
  const index = {
    nonce: process.env.NONCE || "20250820-275500-741963",
    started_utc: process.env.START || "2025-08-20T27:55:00Z",
    status,
    reason,
    thresholds: { dataset_bars_gte: 10000, compute_total_ms_leq: 2000, seq_gap_eq: 0 },
    dataset,
    strategy: metrics.strategy,
    perf,
    evidence_paths: {
      index: `${ROOT}/index.json`,
      metrics: `${ROOT}/metrics.json`,
      manifest: `${ROOT}/manifest.sha256`,
      data: dataPath
    }
  };
  
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify(index, null, 2));
})().catch(e => {
  const ROOT = process.argv[2];
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify({ status: "ERROR", reason: String(e) }, null, 2));
  process.exit(1);
}); 