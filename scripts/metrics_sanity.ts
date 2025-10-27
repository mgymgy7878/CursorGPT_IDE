import fs from "fs";
import path from "path";

type Bar = { ts: number; o: number; h: number; l: number; c: number; v: number; tf: string; sym: string };

const INTERVAL = 60_000;

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

function buildPosEMA(close: number[], shortPeriod: number, longPeriod: number, sl: number, tp: number) {
  const emaShort = ema(close, shortPeriod);
  const emaLong = ema(close, longPeriod);
  const pos = new Array(close.length).fill(0);
  let entryPrice = 0;
  let slPrice = 0;
  let tpPrice = 0;
  let inPosition = false;
  
  for (let i = 1; i < close.length; i++) {
    if (!inPosition) {
      if (emaShort[i] > emaLong[i]) {
        pos[i] = 1;
        inPosition = true;
        entryPrice = close[i];
        slPrice = entryPrice * (1 - sl);
        tpPrice = entryPrice * (1 + tp);
      }
    } else {
      if (close[i] <= slPrice || close[i] >= tpPrice || emaShort[i] <= emaLong[i]) {
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

// Metric Sanity Checks
function checkEquityZero(eq: number[]): boolean {
  return eq[eq.length - 1] <= 1e-6;
}

function checkSharpeCagrConsistency(sharpeVal: number, cagrVal: number): boolean {
  const sharpeSign = Math.sign(sharpeVal);
  const cagrSign = Math.sign(cagrVal);
  return sharpeSign === cagrSign;
}

function checkScaleConsistency(bars: number, interval: number): boolean {
  const totalMinutes = bars * (interval / 60000);
  const annualizationFactor = Math.sqrt(365 * 24 * 60);
  const expectedFactor = Math.sqrt((365 * 24 * 60) / totalMinutes);
  
  // Check if our annualization is reasonable
  return Math.abs(annualizationFactor - expectedFactor) < 0.1;
}

(async () => {
  const dataPath = loadDataPath();
  const bars = readBars(dataPath);
  bars.sort((a, b) => a.ts - b.ts);
  
  const close = bars.map(b => b.c);
  
  // Test EMA_50_200 best candidate
  const best = {
    short: 50,
    long: 250,
    sl: 0,
    tp: 0
  };
  
  const pos = buildPosEMA(close, best.short, best.long, best.sl, best.tp);
  const { ret, eq } = equity(close, pos, 10, 5); // base costs
  
  const sharpeVal = sharpe(ret);
  const cagrVal = cagr(eq);
  const maxDDVal = maxDD(eq);
  
  // Sanity checks
  const equityZero = checkEquityZero(eq);
  const sharpeCagrConsistent = checkSharpeCagrConsistency(sharpeVal, cagrVal);
  const scaleConsistent = checkScaleConsistency(bars.length, INTERVAL);
  
  // Alternative calculations for comparison
  const altSharpe = (r: number[]) => {
    if (r.length < 2) return 0;
    const x = r.slice(1);
    const m = x.reduce((a, b) => a + b, 0) / x.length;
    const v = x.reduce((s, u) => s + (u - m) * (u - m), 0) / x.length;
    const sd = Math.sqrt(v) + 1e-12;
    // Alternative annualization
    const totalMinutes = bars.length * (INTERVAL / 60000);
    const ann = Math.sqrt((365 * 24 * 60) / totalMinutes);
    return (m / sd) * ann;
  };
  
  const altCagr = (eq: number[]) => {
    const totalMinutes = bars.length * (INTERVAL / 60000);
    const years = totalMinutes / (365 * 24 * 60);
    return (Math.pow(eq[eq.length - 1], 1 / years) - 1) * 100;
  };
  
  const altSharpeVal = altSharpe(ret);
  const altCagrVal = altCagr(eq);
  
  const sanity = {
    original_metrics: {
      sharpe: +sharpeVal.toFixed(2),
      cagr_pct: +cagrVal.toFixed(2),
      max_dd_pct: +maxDDVal.toFixed(2)
    },
    alternative_metrics: {
      sharpe: +altSharpeVal.toFixed(2),
      cagr_pct: +altCagrVal.toFixed(2)
    },
    sanity_checks: {
      equity_zero: equityZero,
      sharpe_cagr_consistent: sharpeCagrConsistent,
      scale_consistent: scaleConsistent,
      all_passed: !equityZero && sharpeCagrConsistent && scaleConsistent
    },
    analysis: {
      total_bars: bars.length,
      total_minutes: bars.length * (INTERVAL / 60000),
      total_years: bars.length * (INTERVAL / 60000) / (365 * 24 * 60),
      annualization_factor: Math.sqrt(365 * 24 * 60),
      alternative_factor: Math.sqrt((365 * 24 * 60) / (bars.length * (INTERVAL / 60000)))
    },
    flags: {
      equity_zero_flag: equityZero ? "CRITICAL" : "OK",
      sharpe_cagr_inconsistency: !sharpeCagrConsistent ? "WARNING" : "OK",
      scale_mismatch: !scaleConsistent ? "WARNING" : "OK"
    }
  };
  
  fs.writeFileSync(path.join(process.argv[2], "metrics_sanity.json"), JSON.stringify(sanity, null, 2));
})().catch(e => {
  fs.writeFileSync(path.join(process.argv[2], "metrics_sanity.json"), JSON.stringify({ 
    status: "ERROR", 
    reason: String(e),
    sanity_checks: {
      equity_zero: false,
      sharpe_cagr_consistent: false,
      scale_consistent: false,
      all_passed: false
    }
  }));
  process.exit(1);
}); 