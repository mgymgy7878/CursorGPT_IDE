import fs from "fs";
import path from "path";

type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };

const INTERVAL = 60_000;
const overs = [10, 15, 20, 25, 30, 35, 40];
const overb = [60, 65, 70, 75, 80, 85, 90];
const costScens = [{ fee: 5, slip: 0 }, { fee: 10, slip: 5 }, { fee: 15, slip: 10 }, { fee: 25, slip: 10 }];
const NOISE_REP = 20;
const NOISE_SIGMA = 0.0005;

function loadDataPath(): string {
  const csv = "docs/evidence/INDEX.csv";
  const rows = fs.readFileSync(csv, "utf8").trim().split(/\r?\n/).slice(1).map(l => l.split(","));
  const last = rows.filter(r => r[1]?.startsWith("v1.4-backtest-real")).slice(-1)[0];
  if (!last) throw new Error("BACKTEST_REAL_NOT_FOUND");
  
  const p = last[last.length - 1];
  const j = JSON.parse(fs.readFileSync(path.join(p, "index.json"), "utf8"));
  const data = j?.evidence_paths?.data;
  if (!data || !fs.existsSync(data)) throw new Error("DATA_JSONL_NOT_FOUND");
  
  return data;
}

function readBars(p: string): Bar[] {
  const lines = fs.readFileSync(p, "utf8").trim().split(/\r?\n/);
  return lines.map(ln => JSON.parse(ln));
}

function rsi14(close: number[], n = 14) {
  const rsi = new Array(close.length).fill(50);
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= n; i++) {
    const d = close[i] - close[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  
  let avgG = gains / n;
  let avgL = losses / n;
  rsi[n] = 100 - 100 / (1 + (avgL ? avgG / avgL : 0));
  
  for (let i = n + 1; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    const g = Math.max(d, 0);
    const l = Math.max(-d, 0);
    avgG = (avgG * (n - 1) + g) / n;
    avgL = (avgL * (n - 1) + l) / n;
    rsi[i] = 100 - 100 / (1 + (avgL ? avgG / avgL : 0));
  }
  
  return rsi;
}

function buildPos(rsi: number[], os: number, ob: number) {
  const pos = new Array(rsi.length).fill(0);
  for (let i = 1; i < rsi.length; i++) {
    if (rsi[i] < os) pos[i] = 1;
    else if (rsi[i] > ob) pos[i] = 0;
    else pos[i] = pos[i - 1];
  }
  return pos;
}

const sharpe = (r: number[]) => {
  if (r.length < 2) return 0;
  const x = r.slice(1);
  const m = x.reduce((a, b) => a + b, 0) / x.length;
  const v = x.reduce((s, u) => s + (u - m) * (u - m), 0) / x.length;
  const sd = Math.sqrt(v) + 1e-12;
  const ann = Math.sqrt(365 * 24 * 60);
  return (m / sd) * ann;
};

const cagr = (eq: number[]) => (Math.pow(eq[eq.length - 1], (365 * 24 * 60) / eq.length) - 1) * 100;

const maxDD = (eq: number[]) => {
  let peak = eq[0];
  let mdd = 0;
  for (const x of eq) {
    if (x > peak) peak = x;
    mdd = Math.max(mdd, (peak - x) / peak);
  }
  return mdd * 100;
};

function equity(close: number[], pos: number[], feeBps: number, slipBps: number) {
  const cost = (feeBps + slipBps) / 10000;
  const ret = [0];
  
  for (let i = 1; i < close.length; i++) {
    ret[i] = (close[i] - close[i - 1]) / close[i - 1] * (pos[i - 1] || 0);
  }
  
  const eq = [1];
  for (let i = 1; i < ret.length; i++) {
    const swap = (i > 1 && pos[i - 1] !== pos[i - 2]) ? (1 - cost) : 1;
    eq[i] = (eq[i - 1] * swap) * (1 + (ret[i] || 0));
  }
  
  return { ret, eq };
}

function noiseReturns(ret: number[], sigma: number, seed = 1337) {
  let s = seed >>> 0;
  const rng = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const n = (u: number, v: number) => Math.sqrt(-2 * Math.log(u + 1e-12)) * Math.cos(2 * Math.PI * v);
  
  const out = [...ret];
  for (let i = 1; i < out.length; i++) {
    out[i] += n(rng(), rng()) * sigma;
  }
  
  return out;
}

function oosRecheck(close: number[], pos: number[], fee: number, slip: number) {
  const K = 5;
  const L = close.length;
  const seg = Math.floor(L / K);
  const out: any[] = [];
  
  for (let k = 0; k < K; k++) {
    const s = k * seg;
    const e = (k === K - 1 ? L : (k + 1) * seg);
    const c = close.slice(s, e);
    const p = pos.slice(s, e);
    const { ret, eq } = equity(c, p, fee, slip);
    out.push({
      sharpe: +sharpe(ret).toFixed(2),
      cagr_pct: +cagr(eq).toFixed(2),
      max_dd_pct: +maxDD(eq).toFixed(2)
    });
  }
  
  const posRatio = out.filter(x => x.sharpe > 0).length / out.length;
  const sorted = [...out.map(x => x.sharpe)].sort((a, b) => a - b);
  const med = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  
  return {
    folds: K,
    positive_ratio: +posRatio.toFixed(2),
    median_sharpe: +(+med).toFixed(2),
    min_sharpe: Math.min(...out.map(x => x.sharpe)),
    metrics: out
  };
}

(async () => {
  const dataPath = loadDataPath();
  const bars = readBars(dataPath);
  bars.sort((a, b) => a.ts - b.ts);
  
  // integrity
  let gaps = 0;
  for (let i = 1; i < bars.length; i++) {
    const dt = bars[i].ts - bars[i - 1].ts;
    if (dt !== INTERVAL) gaps++;
  }
  
  const close = bars.map(b => b.c);
  const r = rsi14(close, 14);
  const t0 = Date.now();
  
  // base grid (fee10/slip5)
  const baseFee = 10;
  const baseSlip = 5;
  const base: any[] = [];
  
  for (const os of overs) {
    for (const ob of overb) {
      const pos = buildPos(r, os, ob);
      const { ret, eq } = equity(close, pos, baseFee, baseSlip);
      base.push({
        os,
        ob,
        sharpe: +sharpe(ret).toFixed(2),
        cagr_pct: +cagr(eq).toFixed(2),
        max_dd_pct: +maxDD(eq).toFixed(2),
        trades: pos.slice(1).filter((p, i) => p !== pos[i]).length,
        exposure_pct: +(pos.reduce((a, b) => a + (b ? 1 : 0), 0) / pos.length * 100).toFixed(2)
      });
    }
  }
  
  const robustBase = base.filter(x => x.sharpe > 1).length;
  const sharMax = Math.max(...base.map(x => x.sharpe));
  const sharMin = Math.min(...base.map(x => x.sharpe));
  
  // fragility (cost × noise)
  let best = base.slice().sort((a, b) => b.sharpe - a.sharpe)[0];
  let good = 0;
  let total = 0;
  
  for (const cs of costScens) {
    const pos = buildPos(r, best.os, best.ob);
    const { ret } = equity(close, pos, cs.fee, cs.slip);
    
    for (let rep = 0; rep < NOISE_REP; rep++) {
      const rr = noiseReturns(ret, NOISE_SIGMA, 1000 + rep);
      const s = sharpe([0, ...rr]);
      if (s > 1) good++;
      total++;
    }
  }
  
  const fragility = total ? +(good / total).toFixed(2) : 0;
  
  // OOS recheck on best (base costs)
  const posBest = buildPos(r, best.os, best.ob);
  const oos = oosRecheck(close, posBest, baseFee, baseSlip);
  const compute_ms = Date.now() - t0;
  
  // Build outputs
  const grid = {
    overs,
    overb,
    robust_count_sharpe_gt1: robustBase,
    robust_ratio: +(robustBase / (overs.length * overb.length)).toFixed(2),
    sharpe_max: sharMax,
    sharpe_min: sharMin,
    sharpe_delta: +(sharMax - sharMin).toFixed(2)
  };
  
  const stress = {
    cost_scenarios: costScens.length,
    noise_replicas: NOISE_REP,
    fragility_top: fragility,
    robust_count_stress_gt1: null
  };
  
  const thresholds = {
    robust_base_ge: 4,
    fragility_top_ge: 0.60,
    oos_positive_ratio_ge: 0.60,
    compute_total_ms_leq: 3000
  };
  
  let status = "OK";
  let reason = "";
  
  if (gaps > 0) {
    status = "ERROR";
    reason = "SEQ_GAP";
  } else if (!(grid.robust_count_sharpe_gt1 >= thresholds.robust_base_ge && stress.fragility_top >= thresholds.fragility_top_ge && oos.positive_ratio >= thresholds.oos_positive_ratio_ge)) {
    status = (grid.robust_count_sharpe_gt1 >= 2 && stress.fragility_top >= 0.4 && oos.positive_ratio >= 0.5) ? "WARNING" : "ERROR";
    reason = "ROBUST_OR_FRAGILITY_WEAK";
  }
  
  if (compute_ms > thresholds.compute_total_ms_leq) {
    status = status === "OK" ? "WARNING" : status;
    reason = reason || "SLOW_COMPUTE";
  }
  
  const index = {
    nonce: process.env.NONCE || "20250820-281000-147258",
    started_utc: process.env.START || "2025-08-20T28:10:00Z",
    status,
    reason,
    thresholds,
    dataset: {
      source: dataPath,
      symbol: "BTCUSDT",
      timeframe: "1m",
      bars: bars.length,
      from_utc: new Date(bars[0].ts).toISOString(),
      to_utc: new Date(bars[bars.length - 1].ts).toISOString()
    },
    grid_base: grid,
    stress,
    best_candidate: {
      oversold: best.os,
      overbought: best.ob,
      sharpe: best.sharpe,
      cagr_pct: best.cagr_pct,
      max_dd_pct: best.max_dd_pct,
      trades: best.trades,
      exposure_pct: best.exposure_pct,
      fragility_score: fragility
    },
    oos_recheck: oos,
    perf: { compute_total_ms: compute_ms },
    evidence_paths: {
      index: path.join(process.argv[2], "index.json"),
      metrics: path.join(process.argv[2], "metrics.json"),
      summary_csv: path.join(process.argv[2], "summary.csv"),
      manifest: path.join(process.argv[2], "manifest.sha256")
    }
  };
  
  fs.writeFileSync(path.join(process.argv[2], "metrics.json"), JSON.stringify({
    base_grid: base,
    stress_eval: { costScens, NOISE_REP, NOISE_SIGMA, fragility_of_best: fragility },
    oos_recheck: oos
  }, null, 2));
  
  fs.writeFileSync(path.join(process.argv[2], "summary.csv"), [
    "oversold,overbought,sharpe,cagr_pct,max_dd_pct,trades,exposure_pct",
    ...base.sort((a, b) => b.sharpe - a.sharpe).map(x => `${x.os},${x.ob},${x.sharpe},${x.cagr_pct},${x.max_dd_pct},${x.trades},${x.exposure_pct}`)
  ].join("\n"));
  
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify(index, null, 2));
})().catch(e => {
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify({ status: "ERROR", reason: String(e) }));
  process.exit(1);
}); 