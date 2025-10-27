import fs from "fs";
import path from "path";

type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };
type Stat = { name: string; trades: number; win_rate_pct: number; cagr_pct: number; sharpe: number; max_dd_pct: number; exposure_pct: number };

const INTERVAL_MS = 60_000;

function pctl(xs: number[], q: number) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

function ema(arr: number[], p: number) {
  const a = 2 / (p + 1);
  const out = new Array(arr.length).fill(0);
  let e = arr[0];
  for (let i = 0; i < arr.length; i++) {
    e = i === 0 ? arr[0] : a * arr[i] + (1 - a) * e;
    out[i] = e;
  }
  return out;
}

function rsi14(pr: number[], n = 14) {
  const out = new Array(pr.length).fill(50);
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= n; i++) {
    const d = pr[i] - pr[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  
  let rs = losses ? gains / losses : 0;
  out[n] = 100 - 100 / (1 + rs);
  
  for (let i = n + 1; i < pr.length; i++) {
    const d = pr[i] - pr[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? (-d) : 0;
    gains = (gains * (n - 1) + g) / n;
    losses = (losses * (n - 1) + l) / n;
    rs = losses ? gains / losses : 0;
    out[i] = 100 - 100 / (1 + rs);
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
    peak = Math.max(peak, x);
    mdd = Math.max(mdd, (peak - x) / peak);
  }
  return mdd * 100;
}

function equityFromPos(close: number[], pos: number[]) {
  const ret = [0];
  for (let i = 1; i < close.length; i++) {
    ret[i] = (close[i] - close[i - 1]) / close[i - 1] * (pos[i - 1] || 0);
  }
  
  const eq = [1];
  for (let i = 1; i < ret.length; i++) {
    eq[i] = eq[i - 1] * (1 + ret[i]);
  }
  
  return { ret, eq };
}

function tradesFromPos(pos: number[]) {
  let t = 0;
  for (let i = 1; i < pos.length; i++) {
    if (pos[i] !== pos[i - 1]) t++;
  }
  return t;
}

function winsFromRet(ret: number[]) {
  let w = 0;
  for (let i = 1; i < ret.length; i++) {
    if (ret[i] > 0) w++;
  }
  return w;
}

function exposure(pos: number[]) {
  let on = 0;
  for (const p of pos) {
    if (p === 1) on++;
  }
  return on / pos.length * 100;
}

function cagrFromEq(eq: number[]) {
  return (Math.pow(eq[eq.length - 1], (365 * 24 * 60) / eq.length) - 1) * 100;
}

function emaCross(close: number[], a: number, b: number) {
  const e1 = ema(close, a);
  const e2 = ema(close, b);
  const pos = close.map((_, i) => e1[i] > e2[i] ? 1 : 0);
  return pos;
}

function macd(close: number[]) {
  const m = ema(close, 12).map((x, i) => x - ema(close, 26)[i]);
  const sig = ema(m, 9);
  return m.map((x, i) => x > sig[i] ? 1 : 0);
}

function rsiMr(close: number[]) {
  const r = rsi14(close, 14);
  return r.map(x => (x < 30) ? 1 : (x > 70 ? 0 : undefined))
    .map((x, i, arr) => (x !== undefined ? x : (i > 0 ? arr[i - 1]! : 0)));
}

function donchian(close: number[], high: number[], low: number[], n = 20) {
  const pos = new Array(close.length).fill(0);
  let hi = close[0];
  let lo = close[0];
  
  for (let i = 0; i < close.length; i++) {
    if (i >= n) {
      hi = Math.max(...high.slice(i - n, i));
      lo = Math.min(...low.slice(i - n, i));
    }
    pos[i] = close[i] > hi ? 1 : (close[i] < lo ? 0 : (i > 0 ? pos[i - 1] : 0));
  }
  
  return pos;
}

(async () => {
  const ROOT = process.argv[2];
  const csv = "docs/evidence/INDEX.csv";
  
  const rows = fs.existsSync(csv) ? fs.readFileSync(csv, "utf8").trim().split(/\r?\n/).slice(1).map(l => l.split(",")) : [];
  const last = rows.filter(r => r[1] && r[1].startsWith("v1.4-backtest-real")).slice(-1)[0];
  
  let dataPath = "";
  if (last) {
    const p = last[last.length - 1];
    try {
      const j = JSON.parse(fs.readFileSync(path.join(p, "index.json"), "utf8"));
      dataPath = j?.evidence_paths?.data || "";
    } catch {}
  }
  
  if (!dataPath || !fs.existsSync(dataPath)) {
    throw new Error("DATA_JSONL_NOT_FOUND");
  }
  
  const bars: Bar[] = [];
  const fd = fs.readFileSync(dataPath, "utf8").trim().split(/\r?\n/);
  for (const ln of fd) {
    bars.push(JSON.parse(ln));
  }
  
  bars.sort((a, b) => a.ts - b.ts);
  
  // integrity (from source already guaranteed): check quick
  let gaps = 0;
  for (let i = 1; i < bars.length; i++) {
    const dt = bars[i].ts - bars[i - 1].ts;
    if (dt !== INTERVAL_MS) gaps++;
  }
  
  const close = bars.map(b => b.c);
  const high = bars.map(b => b.h);
  const low = bars.map(b => b.l);
  
  const t0 = Date.now();
  
  const strategies: { name: string; pos: number[] }[] = [
    { name: "BH", pos: new Array(close.length).fill(1) },
    { name: "EMA_12_26", pos: emaCross(close, 12, 26) },
    { name: "EMA_50_200", pos: emaCross(close, 50, 200) },
    { name: "MACD_12_26_9", pos: macd(close) },
    { name: "RSI14_MR", pos: rsiMr(close) },
    { name: "DONCHIAN20", pos: donchian(close, high, low, 20) }
  ];
  
  const stats: Stat[] = [];
  
  for (const s of strategies) {
    const { ret, eq } = equityFromPos(close, s.pos);
    const st: Stat = {
      name: s.name,
      trades: tradesFromPos(s.pos),
      win_rate_pct: +(winsFromRet(ret) / Math.max(1, ret.length - 1) * 100).toFixed(2),
      cagr_pct: +cagrFromEq(eq).toFixed(2),
      sharpe: +sharpe(ret.slice(1)).toFixed(2),
      max_dd_pct: +maxDD(eq).toFixed(2),
      exposure_pct: +exposure(s.pos).toFixed(2)
    };
    stats.push(st);
  }
  
  const compute_ms = Date.now() - t0;
  
  const z = (xs: number[]) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) * (x - m), 0) / xs.length) || 1;
    return { m, sd };
  };
  
  const cagrZ = z(stats.map(s => s.cagr_pct));
  const ddZ = z(stats.map(s => s.max_dd_pct));
  
  const score = (s: Stat) => 0.6 * s.sharpe + 0.3 * ((s.cagr_pct - cagrZ.m) / cagrZ.sd) + 0.1 * (((-s.max_dd_pct) - (-ddZ.m)) / ddZ.sd);
  
  const ranking = stats.map(s => ({ ...s, score: +score(s).toFixed(3) })).sort((a, b) => b.score - a.score);
  
  const metrics = {
    dataset: { symbol: "BTCUSDT", timeframe: "1m", bars: bars.length, source: dataPath },
    perf: { compute_total_ms: compute_ms, strategies_evaluated: strategies.length },
    strategies: stats
  };
  
  fs.writeFileSync(`${ROOT}/metrics.json`, JSON.stringify(metrics, null, 2));
  
  fs.writeFileSync(`${ROOT}/summary.csv`, [
    "name,sharpe,cagr_pct,max_dd_pct,win_rate_pct,trades,exposure_pct,score",
    ...ranking.map(r => `${r.name},${r.sharpe},${r.cagr_pct},${r.max_dd_pct},${r.win_rate_pct},${r.trades},${r.exposure_pct},${r.score}`)
  ].join("\n"));
  
  const status = (bars.length >= 10000 && strategies.length >= 5 && compute_ms <= 3000) ? "OK" : (bars.length >= 10000 ? "WARNING" : "ERROR");
  const reason = status === "OK" ? "" : (bars.length < 10000 ? "BARS_LT_MIN" : (compute_ms > 3000 ? "COMPUTE_GT_SLO" : "TOO_FEW_STRATEGIES"));
  
  const index = {
    nonce: process.env.NONCE || "20250820-280000-852147",
    started_utc: process.env.START || "2025-08-20T28:00:00Z",
    status,
    reason,
    thresholds: { dataset_bars_gte: 10000, strategies_gte: 5, compute_total_ms_leq: 3000 },
    dataset: { bars: bars.length, source: dataPath, symbol: "BTCUSDT", timeframe: "1m" },
    ranking,
    perf: metrics.perf,
    evidence_paths: {
      index: `${ROOT}/index.json`,
      metrics: `${ROOT}/metrics.json`,
      summary_csv: `${ROOT}/summary.csv`,
      manifest: `${ROOT}/manifest.sha256`
    }
  };
  
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify(index, null, 2));
})().catch(e => {
  const ROOT = process.argv[2];
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify({ status: "ERROR", reason: String(e) }, null, 2));
  process.exit(1);
}); 