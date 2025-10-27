import fs from "fs";
import path from "path";

type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };

const INTERVAL = 60_000;
const FEE_BPS = parseFloat(process.env.FEE_BPS || "10");
const SLIP_BPS = parseFloat(process.env.SLIPPAGE_BPS || "5");
const PER_SIDE_COST = (FEE_BPS + SLIP_BPS) / 10000; // her giriş/çıkışta

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

function equityWithCosts(close: number[], pos: number[]) {
  const ret = [0];
  for (let i = 1; i < close.length; i++) {
    ret[i] = (close[i] - close[i - 1]) / close[i - 1] * (pos[i - 1] || 0);
  }
  
  const eq = [1];
  for (let i = 1; i < ret.length; i++) {
    const trade = (i > 1 && pos[i - 1] !== pos[i - 2]) ? (1 - PER_SIDE_COST) : 1;
    eq[i] = (eq[i - 1] * trade) * (1 + (ret[i] || 0));
  }
  
  return { ret, eq };
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

function loadLatestDataPath(): string {
  const csv = "docs/evidence/INDEX.csv";
  if (!fs.existsSync(csv)) throw new Error("INDEX_CSV_NOT_FOUND");
  
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

function buildPosRSIMR(rsi: number[], overSold = 30, overBought = 70) {
  const pos = new Array(rsi.length).fill(0);
  for (let i = 1; i < rsi.length; i++) {
    if (rsi[i] < overSold) pos[i] = 1;
    else if (rsi[i] > overBought) pos[i] = 0;
    else pos[i] = pos[i - 1];
  }
  return pos;
}

function analyze(bars: Bar[]) {
  const close = bars.map(b => b.c);
  const r = rsi14(close, 14);
  const basePos = buildPosRSIMR(r, 30, 70);
  const { ret, eq } = equityWithCosts(close, basePos);
  
  // base stats
  const trades = basePos.slice(1).filter((p, i) => p !== basePos[i]).length;
  let runs: number[] = [];
  let run = 0;
  for (let i = 0; i < basePos.length; i++) {
    if (basePos[i] === 1) {
      run++;
    } else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  
  const avgHold = runs.length ? runs.reduce((a, b) => a + b, 0) / runs.length : 0;
  const days = (bars[bars.length - 1].ts - bars[0].ts) / (1000 * 60 * 60 * 24);
  const turnover = trades / Math.max(1, days);
  const exposure = basePos.reduce((a, b) => a + (b ? 1 : 0), 0) / basePos.length * 100;
  
  const base = {
    sharpe: +sharpe(ret).toFixed(2),
    cagr_pct: +cagr(eq).toFixed(2),
    max_dd_pct: +maxDD(eq).toFixed(2),
    trades,
    exposure_pct: +exposure.toFixed(2),
    turnover_trades_per_day: +turnover.toFixed(2)
  };
  
  // walk-forward 5 folds
  const K = 5;
  const L = close.length;
  const seg = Math.floor(L / K);
  const oos: any[] = [];
  
  for (let k = 0; k < K; k++) {
    const s = k * seg;
    const e = (k === K - 1 ? L : (k + 1) * seg);
    const rr = ret.slice(s, e);
    const p = basePos.slice(s, e); // sabit param; "train yok", OOS stabilite ölçümü
    const { eq: eqk } = equityWithCosts(close.slice(s, e), p);
    oos.push({
      sharpe: +sharpe(rr).toFixed(2),
      cagr_pct: +cagr(eqk).toFixed(2),
      max_dd_pct: +maxDD(eqk).toFixed(2)
    });
  }
  
  const oosSharpe = oos.map(x => x.sharpe);
  const posRatio = oosSharpe.filter(x => x > 0).length / oosSharpe.length;
  
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  
  // sensitivity grid
  const overs = [20, 25, 30, 35];
  const overb = [65, 70, 75, 80];
  const grid: { os: number; ob: number; sharpe: number }[] = [];
  
  for (const os of overs) {
    for (const ob of overb) {
      const pos = buildPosRSIMR(r, os, ob);
      const { ret: gr, eq: ge } = equityWithCosts(close, pos);
      grid.push({ os, ob, sharpe: +sharpe(gr).toFixed(2) });
    }
  }
  
  const gShar = grid.map(g => g.sharpe);
  const gMax = Math.max(...gShar);
  const gMin = Math.min(...gShar);
  const robustCount = grid.filter(g => g.sharpe > 1).length;
  
  return {
    base,
    oos,
    oos_positive_ratio: +posRatio.toFixed(2),
    oos_median_sharpe: +median(oosSharpe).toFixed(2),
    oos_min_sharpe: Math.min(...oosSharpe),
    sensitivity: {
      overs,
      overb,
      sharpe_max: gMax,
      sharpe_min: gMin,
      sharpe_delta: +(gMax - gMin).toFixed(2),
      robust_count_sharpe_gt1: robustCount
    }
  };
}

(async () => {
  const ROOT = process.argv[2];
  const START = process.env.START || "";
  const NONCE = process.env.NONCE || "";
  
  const dataPath = loadLatestDataPath();
  const bars = readBars(dataPath);
  bars.sort((a, b) => a.ts - b.ts);
  
  // integrity quick check
  let gaps = 0;
  for (let i = 1; i < bars.length; i++) {
    const dt = bars[i].ts - bars[i - 1].ts;
    if (dt !== INTERVAL) gaps++;
  }
  
  const t0 = Date.now();
  const res = analyze(bars);
  const compute_ms = Date.now() - t0;
  
  const thresholds = {
    oos_folds_gte: 5,
    oos_positive_ratio_ge: 0.6,
    compute_total_ms_leq: 3000,
    robust_count_sharpe_gt1_ge: 4,
    fee_bps: FEE_BPS,
    slippage_bps: SLIP_BPS
  };
  
  const status = (bars.length > 0 && gaps === 0 && res.oos_positive_ratio >= 0.6 && res.sensitivity.robust_count_sharpe_gt1 >= 4 && compute_ms <= 3000) ? "OK"
    : (bars.length > 0 && gaps === 0 ? "WARNING" : "ERROR");
  
  const reason = gaps > 0 ? "SEQ_GAP" : (res.oos_positive_ratio < 0.6 ? "OOS_WEAK" : (res.sensitivity.robust_count_sharpe_gt1 < 4 ? "SENSITIVITY_UNSTABLE" : (compute_ms > 3000 ? "SLOW_COMPUTE" : "")));
  
  const index = {
    nonce: NONCE,
    started_utc: START,
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
    base_net: res.base,
    oos: {
      folds: 5,
      positive_ratio: res.oos_positive_ratio,
      median_sharpe: res.oos_median_sharpe,
      min_sharpe: res.oos_min_sharpe,
      metrics: res.oos
    },
    sensitivity: res.sensitivity,
    perf: { compute_total_ms: compute_ms },
    evidence_paths: {
      index: `${ROOT}/index.json`,
      metrics: `${ROOT}/metrics.json`,
      summary_csv: `${ROOT}/summary.csv`,
      manifest: `${ROOT}/manifest.sha256`
    }
  };
  
  fs.writeFileSync(`${ROOT}/metrics.json`, JSON.stringify({
    base_net: res.base,
    oos: res.oos,
    sensitivity_grid: res.sensitivity,
    fee_bps: FEE_BPS,
    slippage_bps: SLIP_BPS
  }, null, 2));
  
  fs.writeFileSync(`${ROOT}/summary.csv`, [
    "name,sharpe,cagr_pct,max_dd_pct,trades,exposure_pct,turnover_trades_per_day",
    `RSI14_MR_BASE,${res.base.sharpe},${res.base.cagr_pct},${res.base.max_dd_pct},${res.base.trades},${res.base.exposure_pct},${res.base.turnover_trades_per_day}`,
    `OOS_MEDIAN,${res.oos_median_sharpe},,`,
    ""
  ].join("\n"));
  
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify(index, null, 2));
})().catch(e => {
  const ROOT = process.argv[2];
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify({ status: "ERROR", reason: String(e) }, null, 2));
  process.exit(1);
}); 