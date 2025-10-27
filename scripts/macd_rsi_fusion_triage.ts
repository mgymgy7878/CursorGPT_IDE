import fs from "fs";
import path from "path";

type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };

const INTERVAL = 60_000;
const fastPeriods = [8, 12];
const slowPeriods = [26, 50];
const signalPeriod = 9;
const rsiPeriod = 14;
const oversoldLevels = [25, 30];
const overboughtLevels = [70, 75];
const regimeFilters = [0, 1];
const slTpValues = [0, 0.01];
const costScens = [
  { name: "low", fee: 5, slip: 0 },
  { name: "med", fee: 10, slip: 5 },
  { name: "high", fee: 25, slip: 10 }
];
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

function ema(close: number[], period: number) {
  const alpha = 2 / (period + 1);
  const emaValues = new Array(close.length).fill(0);
  let ema = close[0];
  
  for (let i = 0; i < close.length; i++) {
    ema = i === 0 ? close[0] : alpha * close[i] + (1 - alpha) * ema;
    emaValues[i] = ema;
  }
  
  return emaValues;
}

function macd(close: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  const emaFast = ema(close, fastPeriod);
  const emaSlow = ema(close, slowPeriod);
  const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
  const signalLine = ema(macdLine, signalPeriod);
  const histogram = macdLine.map((macd, i) => macd - signalLine[i]);
  
  return { macdLine, signalLine, histogram };
}

function rsi(close: number[], period: number) {
  const rsiValues = new Array(close.length).fill(50);
  
  for (let i = period; i < close.length; i++) {
    let gains = 0;
    let losses = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      const change = close[j] - close[j - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / (avgLoss + 1e-12);
    rsiValues[i] = 100 - (100 / (1 + rs));
  }
  
  return rsiValues;
}

function sma(close: number[], period: number) {
  const smaValues = new Array(close.length).fill(close[0]);
  
  for (let i = period - 1; i < close.length; i++) {
    const sum = close.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    smaValues[i] = sum / period;
  }
  
  return smaValues;
}

function buildPosMACDRSI(close: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number, 
                        rsiPeriod: number, oversold: number, overbought: number, regimeFilter: number, 
                        sl: number, tp: number) {
  const { macdLine, signalLine } = macd(close, fastPeriod, slowPeriod, signalPeriod);
  const rsiValues = rsi(close, rsiPeriod);
  const sma200 = sma(close, 200);
  
  const pos = new Array(close.length).fill(0);
  let entryPrice = 0;
  let slPrice = 0;
  let tpPrice = 0;
  let inPosition = false;
  
  for (let i = 200; i < close.length; i++) {
    if (!inPosition) {
      const macdSignal = macdLine[i] > signalLine[i];
      const rsiSignal = rsiValues[i] < oversold;
      const regimeSignal = regimeFilter === 0 || close[i] > sma200[i];
      
      if (macdSignal && rsiSignal && regimeSignal) {
        pos[i] = 1;
        inPosition = true;
        entryPrice = close[i];
        slPrice = entryPrice * (1 - sl);
        tpPrice = entryPrice * (1 + tp);
      }
    } else {
      const exitSignal = close[i] <= slPrice || close[i] >= tpPrice || 
                        rsiValues[i] > overbought || macdLine[i] <= signalLine[i];
      
      if (exitSignal) {
        pos[i] = 0;
        inPosition = false;
      } else {
        pos[i] = 1;
      }
    }
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
  const t0 = Date.now();
  
  // base grid (med cost regime)
  const baseFee = 10;
  const baseSlip = 5;
  const base: any[] = [];
  
  for (const fast of fastPeriods) {
    for (const slow of slowPeriods) {
      if (slow <= fast) continue; // slow > fast constraint
      
      for (const oversold of oversoldLevels) {
        for (const overbought of overboughtLevels) {
          for (const regime of regimeFilters) {
            for (const sl of slTpValues) {
              for (const tp of slTpValues) {
                const pos = buildPosMACDRSI(close, fast, slow, signalPeriod, rsiPeriod, 
                                          oversold, overbought, regime, sl, tp);
                const { ret, eq } = equity(close, pos, baseFee, baseSlip);
                
                base.push({
                  fast,
                  slow,
                  signal: signalPeriod,
                  rsi: rsiPeriod,
                  oversold,
                  overbought,
                  regime,
                  sl,
                  tp,
                  sharpe: +sharpe(ret).toFixed(2),
                  cagr_pct: +cagr(eq).toFixed(2),
                  max_dd_pct: +maxDD(eq).toFixed(2),
                  trades: pos.slice(1).filter((p, i) => p !== pos[i]).length,
                  exposure_pct: +(pos.reduce((a, b) => a + (b ? 1 : 0), 0) / pos.length * 100).toFixed(2)
                });
              }
            }
          }
        }
      }
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
    const pos = buildPosMACDRSI(close, best.fast, best.slow, signalPeriod, rsiPeriod,
                              best.oversold, best.overbought, best.regime, best.sl, best.tp);
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
  const posBest = buildPosMACDRSI(close, best.fast, best.slow, signalPeriod, rsiPeriod,
                                best.oversold, best.overbought, best.regime, best.sl, best.tp);
  const oos = oosRecheck(close, posBest, baseFee, baseSlip);
  const compute_ms = Date.now() - t0;
  
  // Build outputs
  const grid = {
    fastPeriods,
    slowPeriods,
    signalPeriod,
    rsiPeriod,
    oversoldLevels,
    overboughtLevels,
    regimeFilters,
    slTpValues,
    robust_count_sharpe_gt1: robustBase,
    robust_ratio: +(robustBase / base.length).toFixed(2),
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
    nonce: process.env.NONCE || "20250820-282000-369147",
    started_utc: process.env.START || "2025-08-20T28:20:00Z",
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
      fast: best.fast,
      slow: best.slow,
      signal: best.signal,
      rsi: best.rsi,
      oversold: best.oversold,
      overbought: best.overbought,
      regime: best.regime,
      sl: best.sl,
      tp: best.tp,
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
    "fast,slow,signal,rsi,oversold,overbought,regime,sl,tp,sharpe,cagr_pct,max_dd_pct,trades,exposure_pct",
    ...base.sort((a, b) => b.sharpe - a.sharpe).map(x => `${x.fast},${x.slow},${x.signal},${x.rsi},${x.oversold},${x.overbought},${x.regime},${x.sl},${x.tp},${x.sharpe},${x.cagr_pct},${x.max_dd_pct},${x.trades},${x.exposure_pct}`)
  ].join("\n"));
  
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify(index, null, 2));
})().catch(e => {
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify({ status: "ERROR", reason: String(e) }));
  process.exit(1);
}); 