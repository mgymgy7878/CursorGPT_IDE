import fs from "fs";
import path from "path";

type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };

const INTERVAL = 60_000;
const shortPeriods = [5, 10, 20];
const longPeriods = [50, 100, 150];
const volTargets = [0.10, 0.15, 0.20];
const atrWindows = [14, 21];
const kValues = [0.5, 1.0];
const maxLeverage = 1;
const slTypes = [1, 2]; // 1ATR, 2ATR
const tpTypes = [0, 2, 3]; // 0, 2ATR, 3ATR
const cooldowns = [0, 5];
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

function atr(high: number[], low: number[], close: number[], period: number) {
  const tr = new Array(high.length).fill(0);
  const atrValues = new Array(high.length).fill(0);
  
  for (let i = 1; i < high.length; i++) {
    const hl = high[i] - low[i];
    const hc = Math.abs(high[i] - close[i - 1]);
    const lc = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(hl, hc, lc);
  }
  
  // Calculate ATR
  let atrSum = 0;
  for (let i = 1; i <= period; i++) {
    atrSum += tr[i];
  }
  atrValues[period] = atrSum / period;
  
  for (let i = period + 1; i < high.length; i++) {
    atrValues[i] = (atrValues[i - 1] * (period - 1) + tr[i]) / period;
  }
  
  return atrValues;
}

function volatilityEstimate(close: number[], period: number) {
  const returns = new Array(close.length).fill(0);
  for (let i = 1; i < close.length; i++) {
    returns[i] = Math.abs((close[i] - close[i - 1]) / close[i - 1]);
  }
  
  const volEst = ema(returns, period);
  return volEst;
}

function buildPosVolTargetMA(close: number[], high: number[], low: number[], shortPeriod: number, longPeriod: number,
                           volTarget: number, atrWin: number, k: number, slType: number, tpType: number, cooldown: number) {
  const maShort = ema(close, shortPeriod);
  const maLong = ema(close, longPeriod);
  const atrValues = atr(high, low, close, atrWin);
  const volEst = volatilityEstimate(close, atrWin);
  
  const pos = new Array(close.length).fill(0);
  const posSize = new Array(close.length).fill(0);
  let entryPrice = 0;
  let slPrice = 0;
  let tpPrice = 0;
  let inPosition = false;
  let lastTradeTime = 0;
  
  for (let i = Math.max(shortPeriod, longPeriod, atrWin); i < close.length; i++) {
    const timeSinceLastTrade = i - lastTradeTime;
    
    if (!inPosition && timeSinceLastTrade >= cooldown) {
      const maSignal = maShort[i] > maLong[i];
      
      if (maSignal) {
        const volEstAnnual = volEst[i] * Math.sqrt(365 * 24 * 60);
        const targetSize = Math.min(k * (volTarget / volEstAnnual), maxLeverage);
        const actualSize = Math.max(0, targetSize);
        
        if (actualSize > 0) {
          pos[i] = 1;
          posSize[i] = actualSize;
          inPosition = true;
          entryPrice = close[i];
          lastTradeTime = i;
          
          // Set SL/TP based on ATR
          const atrVal = atrValues[i];
          slPrice = entryPrice - (slType * atrVal);
          
          if (tpType === 0) {
            tpPrice = Infinity;
          } else {
            tpPrice = entryPrice + (tpType * atrVal);
          }
        }
      }
    } else if (inPosition) {
      const exitSignal = close[i] <= slPrice || close[i] >= tpPrice || maShort[i] <= maLong[i];
      
      if (exitSignal) {
        pos[i] = 0;
        posSize[i] = 0;
        inPosition = false;
        lastTradeTime = i;
      } else {
        pos[i] = 1;
        posSize[i] = posSize[i - 1];
      }
    }
  }
  
  return { pos, posSize };
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

function equity(close: number[], pos: number[], posSize: number[], feeBps: number, slipBps: number) {
  const cost = (feeBps + slipBps) / 10000;
  const ret = [0];
  
  for (let i = 1; i < close.length; i++) {
    ret[i] = (close[i] - close[i - 1]) / close[i - 1] * (pos[i - 1] || 0) * (posSize[i - 1] || 0);
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

function oosRecheck(close: number[], pos: number[], posSize: number[], fee: number, slip: number) {
  const K = 5;
  const L = close.length;
  const seg = Math.floor(L / K);
  const out: any[] = [];
  
  for (let k = 0; k < K; k++) {
    const s = k * seg;
    const e = (k === K - 1 ? L : (k + 1) * seg);
    const c = close.slice(s, e);
    const p = pos.slice(s, e);
    const ps = posSize.slice(s, e);
    const { ret, eq } = equity(c, p, ps, fee, slip);
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
  const high = bars.map(b => b.h);
  const low = bars.map(b => b.l);
  const t0 = Date.now();
  
  // base grid (med cost regime)
  const baseFee = 10;
  const baseSlip = 5;
  const base: any[] = [];
  
  for (const short of shortPeriods) {
    for (const long of longPeriods) {
      if (long <= short) continue; // long > short constraint
      
      for (const volTarget of volTargets) {
        for (const atrWin of atrWindows) {
          for (const k of kValues) {
            for (const sl of slTypes) {
              for (const tp of tpTypes) {
                for (const cooldown of cooldowns) {
                  const { pos, posSize } = buildPosVolTargetMA(close, high, low, short, long, 
                                                             volTarget, atrWin, k, sl, tp, cooldown);
                  const { ret, eq } = equity(close, pos, posSize, baseFee, baseSlip);
                  
                  base.push({
                    short,
                    long,
                    vol_target: volTarget,
                    atr_win: atrWin,
                    k,
                    sl: `${sl}ATR`,
                    tp: tp === 0 ? "0" : `${tp}ATR`,
                    cooldown,
                    sharpe: +sharpe(ret).toFixed(2),
                    cagr_pct: +cagr(eq).toFixed(2),
                    max_dd_pct: +maxDD(eq).toFixed(2),
                    trades: pos.slice(1).filter((p, i) => p !== pos[i]).length,
                    exposure_pct: +(pos.reduce((a, b) => a + (b ? 1 : 0), 0) / pos.length * 100).toFixed(2),
                    avg_pos_size: +(posSize.reduce((a, b) => a + b, 0) / posSize.length).toFixed(3)
                  });
                }
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
    const { pos, posSize } = buildPosVolTargetMA(close, high, low, best.short, best.long,
                                               best.vol_target, best.atr_win, best.k,
                                               parseInt(best.sl), parseInt(best.tp) || 0, best.cooldown);
    const { ret } = equity(close, pos, posSize, cs.fee, cs.slip);
    
    for (let rep = 0; rep < NOISE_REP; rep++) {
      const rr = noiseReturns(ret, NOISE_SIGMA, 1000 + rep);
      const s = sharpe([0, ...rr]);
      if (s > 1) good++;
      total++;
    }
  }
  
  const fragility = total ? +(good / total).toFixed(2) : 0;
  
  // OOS recheck on best (base costs)
  const { pos: posBest, posSize: posSizeBest } = buildPosVolTargetMA(close, high, low, best.short, best.long,
                                                                   best.vol_target, best.atr_win, best.k,
                                                                   parseInt(best.sl), parseInt(best.tp) || 0, best.cooldown);
  const oos = oosRecheck(close, posBest, posSizeBest, baseFee, baseSlip);
  const compute_ms = Date.now() - t0;
  
  // Build outputs
  const grid = {
    shortPeriods,
    longPeriods,
    volTargets,
    atrWindows,
    kValues,
    maxLeverage,
    slTypes,
    tpTypes,
    cooldowns,
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
    nonce: process.env.NONCE || "20250820-283000-963741",
    started_utc: process.env.START || "2025-08-20T28:30:00Z",
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
      short: best.short,
      long: best.long,
      vol_target: best.vol_target,
      atr_win: best.atr_win,
      k: best.k,
      sl: best.sl,
      tp: best.tp,
      cooldown: best.cooldown,
      sharpe: best.sharpe,
      cagr_pct: best.cagr_pct,
      max_dd_pct: best.max_dd_pct,
      trades: best.trades,
      exposure_pct: best.exposure_pct,
      avg_pos_size: best.avg_pos_size,
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
    "short,long,vol_target,atr_win,k,sl,tp,cooldown,sharpe,cagr_pct,max_dd_pct,trades,exposure_pct,avg_pos_size",
    ...base.sort((a, b) => b.sharpe - a.sharpe).map(x => `${x.short},${x.long},${x.vol_target},${x.atr_win},${x.k},${x.sl},${x.tp},${x.cooldown},${x.sharpe},${x.cagr_pct},${x.max_dd_pct},${x.trades},${x.exposure_pct},${x.avg_pos_size}`)
  ].join("\n"));
  
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify(index, null, 2));
})().catch(e => {
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify({ status: "ERROR", reason: String(e) }));
  process.exit(1);
}); 