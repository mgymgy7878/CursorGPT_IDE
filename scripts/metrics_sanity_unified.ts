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

function atr(high: number[], low: number[], close: number[], period: number) {
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
        const targetSize = Math.min(k * (volTarget / volEstAnnual), 1);
        const actualSize = Math.max(0, targetSize);
        
        if (actualSize > 0) {
          pos[i] = 1;
          posSize[i] = actualSize;
          inPosition = true;
          entryPrice = close[i];
          lastTradeTime = i;
          
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

// Enhanced Metric Sanity Checks
function checkEquityZero(eq: number[]): boolean {
  return eq[eq.length - 1] <= 1e-6;
}

function checkSharpeCagrConsistency(sharpeVal: number, cagrVal: number): boolean {
  const sharpeSign = Math.sign(sharpeVal);
  const cagrSign = Math.sign(cagrVal);
  return sharpeSign === cagrSign;
}

function checkAnnualizationFactor(bars: number, interval: number): boolean {
  const totalMinutes = bars * (interval / 60000);
  const annualizationFactor = Math.sqrt(365 * 24 * 60);
  const expectedFactor = Math.sqrt((365 * 24 * 60) / totalMinutes);
  
  return Math.abs(annualizationFactor - expectedFactor) < 0.1;
}

function checkNetOfFeeConsistency(eq: number[], ret: number[]): boolean {
  const cumulativeReturn = ret.slice(1).reduce((sum, r) => sum + r, 0);
  const finalEquity = eq[eq.length - 1];
  const expectedEquity = Math.exp(cumulativeReturn);
  
  return Math.abs(finalEquity - expectedEquity) < 0.1;
}

// Alternative calculations with proper annualization
function altSharpe(r: number[], bars: number, interval: number) {
  if (r.length < 2) return 0;
  const x = r.slice(1);
  const m = x.reduce((a, b) => a + b, 0) / x.length;
  const v = x.reduce((s, u) => s + (u - m) * (u - m), 0) / x.length;
  const sd = Math.sqrt(v) + 1e-12;
  
  const totalMinutes = bars * (interval / 60000);
  const ann = Math.sqrt((365 * 24 * 60) / totalMinutes);
  return (m / sd) * ann;
}

function altCagr(eq: number[], bars: number, interval: number) {
  const totalMinutes = bars * (interval / 60000);
  const years = totalMinutes / (365 * 24 * 60);
  return (Math.pow(eq[eq.length - 1], 1 / years) - 1) * 100;
}

(async () => {
  const dataPath = loadDataPath();
  const bars = readBars(dataPath);
  bars.sort((a, b) => a.ts - b.ts);
  
  const close = bars.map(b => b.c);
  const high = bars.map(b => b.h);
  const low = bars.map(b => b.l);
  
  // Test VolTarget-MA best candidate from previous triage
  const best = {
    short: 5,
    long: 50,
    vol_target: 0.2,
    atr_win: 14,
    k: 1,
    sl: 1,
    tp: 2,
    cooldown: 5
  };
  
  const { pos, posSize } = buildPosVolTargetMA(close, high, low, best.short, best.long,
                                             best.vol_target, best.atr_win, best.k,
                                             best.sl, best.tp, best.cooldown);
  const { ret, eq } = equity(close, pos, posSize, 10, 5);
  
  const sharpeVal = sharpe(ret);
  const cagrVal = cagr(eq);
  const altSharpeVal = altSharpe(ret, bars.length, INTERVAL);
  const altCagrVal = altCagr(eq, bars.length, INTERVAL);
  
  // Sanity checks
  const equityZero = checkEquityZero(eq);
  const sharpeCagrConsistent = checkSharpeCagrConsistency(sharpeVal, cagrVal);
  const annualizationConsistent = checkAnnualizationFactor(bars.length, INTERVAL);
  const netOfFeeConsistent = checkNetOfFeeConsistency(eq, ret);
  
  const sanity = {
    voltarget_ma: {
      original_metrics: {
        sharpe: +sharpeVal.toFixed(2),
        cagr_pct: +cagrVal.toFixed(2)
      },
      alternative_metrics: {
        sharpe: +altSharpeVal.toFixed(2),
        cagr_pct: +altCagrVal.toFixed(2)
      },
      sanity_checks: {
        equity_zero: equityZero,
        sharpe_cagr_consistent: sharpeCagrConsistent,
        annualization_consistent: annualizationConsistent,
        net_of_fee_consistent: netOfFeeConsistent,
        all_passed: !equityZero && sharpeCagrConsistent && annualizationConsistent && netOfFeeConsistent
      }
    },
    analysis: {
      total_bars: bars.length,
      total_minutes: bars.length * (INTERVAL / 60000),
      total_years: bars.length * (INTERVAL / 60000) / (365 * 24 * 60),
      annualization_factor: Math.sqrt(365 * 24 * 60),
      alternative_factor: Math.sqrt((365 * 24 * 60) / (bars.length * (INTERVAL / 60000)))
    },
    flags: {
      equity_zero: equityZero ? "CRITICAL" : "OK",
      sharpe_cagr_inconsistency: !sharpeCagrConsistent ? "WARNING" : "OK",
      annualization_mismatch: !annualizationConsistent ? "WARNING" : "OK",
      net_of_fee_inconsistency: !netOfFeeConsistent ? "WARNING" : "OK"
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
      annualization_consistent: false,
      net_of_fee_consistent: false,
      all_passed: false
    }
  }));
  process.exit(1);
}); 