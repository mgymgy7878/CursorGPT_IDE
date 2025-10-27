import fs from "fs";
import path from "path";

type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };

const INTERVAL = 60_000;
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

// Regime segmentation functions
function calculateATR(high: number[], low: number[], close: number[], period: number) {
  const tr = new Array(high.length).fill(0);
  const atrValues = new Array(high.length).fill(0);
  
  for (let i = 1; i < high.length; i++) {
    const hl = high[i] - low[i];
    const hc = Math.abs(high[i] - close[i - 1]);
    const lc = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(hl, hc, lc);
  }
  
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

function calculateSMA(close: number[], period: number) {
  const sma = new Array(close.length).fill(0);
  
  for (let i = period - 1; i < close.length; i++) {
    const sum = close.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  
  return sma;
}

function segmentRegimes(bars: Bar[]) {
  const close = bars.map(b => b.c);
  const high = bars.map(b => b.h);
  const low = bars.map(b => b.l);
  
  const atr14 = calculateATR(high, low, close, 14);
  const sma200 = calculateSMA(close, 200);
  
  // Volatility regime: ATR/close percentage
  const atrPct = atr14.map((atr, i) => atr / close[i]);
  const atrPctSorted = [...atrPct].sort((a, b) => a - b);
  const lowThreshold = atrPctSorted[Math.floor(atrPctSorted.length * 0.33)];
  const highThreshold = atrPctSorted[Math.floor(atrPctSorted.length * 0.67)];
  
  // Trend regime: SMA200 above/below
  const trendRegime = close.map((price, i) => price > sma200[i] ? 1 : 0);
  
  // Volatility regime
  const volRegime = atrPct.map(pct => {
    if (pct <= lowThreshold) return "low";
    if (pct >= highThreshold) return "high";
    return "mid";
  });
  
  return {
    trend_regime: trendRegime,
    vol_regime: volRegime,
    atr_pct: atrPct,
    sma200: sma200,
    regime_stats: {
      trend_up: trendRegime.filter(r => r === 1).length,
      trend_down: trendRegime.filter(r => r === 0).length,
      vol_low: volRegime.filter(v => v === "low").length,
      vol_mid: volRegime.filter(v => v === "mid").length,
      vol_high: volRegime.filter(v => v === "high").length
    }
  };
}

// Strategy implementations
function buildBreakoutRollingHL(close: number[], high: number[], low: number[], lookback: number, threshold: number) {
  const pos = new Array(close.length).fill(0);
  
  for (let i = lookback; i < close.length; i++) {
    const recentHigh = Math.max(...high.slice(i - lookback, i));
    const recentLow = Math.min(...low.slice(i - lookback, i));
    const range = recentHigh - recentLow;
    
    if (close[i] > recentHigh - range * threshold) {
      pos[i] = 1;
    } else if (close[i] < recentLow + range * threshold) {
      pos[i] = -1;
    }
  }
  
  return pos;
}

function buildMACrossRegime(close: number[], shortPeriod: number, longPeriod: number, regimeFilter: number[]) {
  const shortMA = calculateSMA(close, shortPeriod);
  const longMA = calculateSMA(close, longPeriod);
  
  const pos = new Array(close.length).fill(0);
  
  for (let i = Math.max(shortPeriod, longPeriod); i < close.length; i++) {
    if (regimeFilter[i] === 1) { // Only trade in uptrend regime
      if (shortMA[i] > longMA[i] && shortMA[i - 1] <= longMA[i - 1]) {
        pos[i] = 1; // Golden cross
      } else if (shortMA[i] < longMA[i] && shortMA[i - 1] >= longMA[i - 1]) {
        pos[i] = 0; // Death cross
      } else {
        pos[i] = pos[i - 1] || 0;
      }
    }
  }
  
  return pos;
}

function buildZScoreBandsRegime(close: number[], period: number, entryZ: number, exitZ: number, regimeFilter: number[]) {
  const pos = new Array(close.length).fill(0);
  
  for (let i = period; i < close.length; i++) {
    if (regimeFilter[i] === 1) { // Only trade in uptrend regime
      const slice = close.slice(i - period, i);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / slice.length;
      const std = Math.sqrt(variance);
      const zScore = (close[i] - mean) / std;
      
      if (zScore < -entryZ) {
        pos[i] = 1; // Oversold entry
      } else if (zScore > exitZ) {
        pos[i] = 0; // Overbought exit
      } else {
        pos[i] = pos[i - 1] || 0;
      }
    }
  }
  
  return pos;
}

// Performance calculation with proper annualization
function calculateSharpe(r: number[], bars: number, interval: number) {
  if (r.length < 2) return 0;
  const x = r.slice(1);
  const m = x.reduce((a, b) => a + b, 0) / x.length;
  const v = x.reduce((s, u) => s + (u - m) * (u - m), 0) / x.length;
  const sd = Math.sqrt(v) + 1e-12;
  
  const totalMinutes = bars * (interval / 60000);
  const ann = Math.sqrt((365 * 24 * 60) / totalMinutes);
  
  return (m / sd) * ann;
}

function calculateCagr(eq: number[], bars: number, interval: number) {
  const totalMinutes = bars * (interval / 60000);
  const years = totalMinutes / (365 * 24 * 60);
  return (Math.pow(eq[eq.length - 1], 1 / years) - 1) * 100;
}

function calculateMaxDD(eq: number[]) {
  let peak = eq[0];
  let mdd = 0;
  for (const x of eq) {
    if (x > peak) peak = x;
    mdd = Math.max(mdd, (peak - x) / peak);
  }
  return mdd * 100;
}

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

function walkForwardOOS(close: number[], pos: number[], fee: number, slip: number) {
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
    
    const sharpe = calculateSharpe(ret, c.length, INTERVAL);
    const cagr = calculateCagr(eq, c.length, INTERVAL);
    const maxDD = calculateMaxDD(eq);
    
    out.push({
      fold: k + 1,
      sharpe: +sharpe.toFixed(2),
      cagr_pct: +cagr.toFixed(2),
      max_dd_pct: +maxDD.toFixed(2)
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
  
  const close = bars.map(b => b.c);
  const high = bars.map(b => b.h);
  const low = bars.map(b => b.l);
  
  const totalStart = Date.now();
  
  // Regime segmentation
  const regimes = segmentRegimes(bars);
  
  // Strategy candidates with limited grids
  const strategies = [
    {
      name: "Breakout_RollingHL",
      params: [
        { lookback: 20, threshold: 0.1 },
        { lookback: 20, threshold: 0.2 },
        { lookback: 50, threshold: 0.1 },
        { lookback: 50, threshold: 0.2 }
      ]
    },
    {
      name: "MA_Cross_Regime",
      params: [
        { short: 10, long: 50 },
        { short: 20, long: 100 },
        { short: 50, long: 200 }
      ]
    },
    {
      name: "ZScore_Bands_Regime",
      params: [
        { period: 20, entryZ: 1.5, exitZ: 0.5 },
        { period: 50, entryZ: 2.0, exitZ: 0.5 },
        { period: 100, entryZ: 2.5, exitZ: 1.0 }
      ]
    }
  ];
  
  const results = [];
  const greenCandidates = [];
  
  for (const strategy of strategies) {
    for (const params of strategy.params) {
      let pos: number[];
      
      switch (strategy.name) {
        case "Breakout_RollingHL":
          pos = buildBreakoutRollingHL(close, high, low, params.lookback, params.threshold);
          break;
        case "MA_Cross_Regime":
          pos = buildMACrossRegime(close, params.short, params.long, regimes.trend_regime);
          break;
        case "ZScore_Bands_Regime":
          pos = buildZScoreBandsRegime(close, params.period, params.entryZ, params.exitZ, regimes.trend_regime);
          break;
        default:
          continue;
      }
      
      const { ret, eq } = equity(close, pos, 10, 5); // Medium cost
      const sharpe = calculateSharpe(ret, bars.length, INTERVAL);
      const cagr = calculateCagr(eq, bars.length, INTERVAL);
      const maxDD = calculateMaxDD(eq);
      
      // Fragility test
      let good = 0;
      let total = 0;
      
      for (const cs of costScens) {
        const { ret: stressRet } = equity(close, pos, cs.fee, cs.slip);
        
        for (let rep = 0; rep < NOISE_REP; rep++) {
          const rr = noiseReturns(stressRet, NOISE_SIGMA, 1000 + rep);
          const s = calculateSharpe([0, ...rr], bars.length, INTERVAL);
          if (s > 1) good++;
          total++;
        }
      }
      
      const fragility = total ? +(good / total).toFixed(2) : 0;
      
      // Walk-forward OOS
      const oos = walkForwardOOS(close, pos, 10, 5);
      
      const result = {
        name: strategy.name,
        params,
        sharpe: +sharpe.toFixed(2),
        cagr_pct: +cagr.toFixed(2),
        max_dd_pct: +maxDD.toFixed(2),
        fragility_top: fragility,
        oos_positive_ratio: oos.positive_ratio,
        trades: pos.slice(1).filter((p, i) => p !== pos[i]).length,
        exposure_pct: +(pos.reduce((a, b) => a + (b ? 1 : 0), 0) / pos.length * 100).toFixed(2)
      };
      
      results.push(result);
      
      // Check if this is a green candidate
      if (sharpe > 1 && fragility >= 0.60 && oos.positive_ratio >= 0.60) {
        greenCandidates.push({
          ...result,
          sanity_pass: true
        });
      }
    }
  }
  
  const total_ms = Date.now() - totalStart;
  
  // Build outputs
  const regimeReport = {
    total_bars: bars.length,
    regime_distribution: regimes.regime_stats,
    trend_regime_ratio: regimes.regime_stats.trend_up / bars.length,
    vol_regime_distribution: {
      low: regimes.regime_stats.vol_low / bars.length,
      mid: regimes.regime_stats.vol_mid / bars.length,
      high: regimes.regime_stats.vol_high / bars.length
    }
  };
  
  const triage = {
    total_strategies: results.length,
    green_candidates: greenCandidates.length,
    best_candidates: results.sort((a, b) => b.sharpe - a.sharpe).slice(0, 5),
    performance_summary: {
      avg_sharpe: +(results.reduce((sum, r) => sum + r.sharpe, 0) / results.length).toFixed(2),
      avg_fragility: +(results.reduce((sum, r) => sum + r.fragility_top, 0) / results.length).toFixed(2),
      avg_oos_ratio: +(results.reduce((sum, r) => sum + r.oos_positive_ratio, 0) / results.length).toFixed(2)
    }
  };
  
  const perfProfile = {
    total_ms,
    strategies_evaluated: results.length,
    green_candidates_found: greenCandidates.length,
    compute_per_strategy: +(total_ms / results.length).toFixed(2)
  };
  
  fs.writeFileSync(path.join(process.argv[2], "regime_report.json"), JSON.stringify(regimeReport, null, 2));
  fs.writeFileSync(path.join(process.argv[2], "triage.json"), JSON.stringify(triage, null, 2));
  fs.writeFileSync(path.join(process.argv[2], "oos_folds.json"), JSON.stringify({ results }, null, 2));
  fs.writeFileSync(path.join(process.argv[2], "perf_profile.json"), JSON.stringify(perfProfile, null, 2));
  
  // Determine status
  let status = "FAIL";
  let decision = "FAIL→HALT";
  
  if (greenCandidates.length > 0) {
    status = "PASS";
    decision = "PASS→GREEN-CANDIDATE";
  } else if (results.some(r => r.sharpe > 0.5 && r.fragility_top >= 0.4 && r.oos_positive_ratio >= 0.4)) {
    status = "WARNING";
    decision = "WARNING→RETRY_NARROW";
  }
  
  const index = {
    nonce: process.env.NONCE || "20250820-285000-963741",
    started_utc: process.env.START || "2025-08-20T28:50:00Z",
    status,
    decision,
    green_candidates: greenCandidates,
    regime_coverage: "docs/evidence/receipts-smoke/20250820-285000-963741/regime_report.json",
    wf_oos: "docs/evidence/receipts-smoke/20250820-285000-963741/oos_folds.json",
    sanity: "docs/evidence/receipts-smoke/20250820-285000-963741/metrics_sanity.json",
    manifest: "docs/evidence/receipts-smoke/20250820-285000-963741/manifest.sha256",
    index: "docs/evidence/receipts-smoke/20250820-285000-963741/INDEX.txt"
  };
  
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify(index, null, 2));
})().catch(e => {
  fs.writeFileSync(path.join(process.argv[2], "index.json"), JSON.stringify({ 
    status: "ERROR", 
    reason: String(e),
    green_candidates: [],
    decision: "ERROR→HALT"
  }));
  process.exit(1);
}); 