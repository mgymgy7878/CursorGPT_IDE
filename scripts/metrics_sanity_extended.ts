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

// Enhanced Metric Sanity Checks
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
  
  return Math.abs(annualizationFactor - expectedFactor) < 0.1;
}

function checkNetOfFeeConsistency(eq: number[], ret: number[]): boolean {
  // Check if equity curve makes sense given returns
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
  
  // Test EMA_50_200 best candidate
  const emaBest = {
    short: 50,
    long: 250,
    sl: 0,
    tp: 0
  };
  
  const emaPos = buildPosEMA(close, emaBest.short, emaBest.long, emaBest.sl, emaBest.tp);
  const emaEquity = equity(close, emaPos, 10, 5);
  
  const emaSharpeVal = sharpe(emaEquity.ret);
  const emaCagrVal = cagr(emaEquity.eq);
  const emaAltSharpeVal = altSharpe(emaEquity.ret, bars.length, INTERVAL);
  const emaAltCagrVal = altCagr(emaEquity.eq, bars.length, INTERVAL);
  
  // Test MACD_RSI_fusion best candidate
  const macdBest = {
    fast: 8,
    slow: 50,
    signal: 9,
    rsi: 14,
    oversold: 30,
    overbought: 70,
    regime: 1,
    sl: 0,
    tp: 0.01
  };
  
  const macdPos = buildPosMACDRSI(close, macdBest.fast, macdBest.slow, macdBest.signal, 
                                macdBest.rsi, macdBest.oversold, macdBest.overbought, 
                                macdBest.regime, macdBest.sl, macdBest.tp);
  const macdEquity = equity(close, macdPos, 10, 5);
  
  const macdSharpeVal = sharpe(macdEquity.ret);
  const macdCagrVal = cagr(macdEquity.eq);
  const macdAltSharpeVal = altSharpe(macdEquity.ret, bars.length, INTERVAL);
  const macdAltCagrVal = altCagr(macdEquity.eq, bars.length, INTERVAL);
  
  // Sanity checks for both strategies
  const emaEquityZero = checkEquityZero(emaEquity.eq);
  const emaSharpeCagrConsistent = checkSharpeCagrConsistency(emaSharpeVal, emaCagrVal);
  const emaScaleConsistent = checkScaleConsistency(bars.length, INTERVAL);
  const emaNetOfFeeConsistent = checkNetOfFeeConsistency(emaEquity.eq, emaEquity.ret);
  
  const macdEquityZero = checkEquityZero(macdEquity.eq);
  const macdSharpeCagrConsistent = checkSharpeCagrConsistency(macdSharpeVal, macdCagrVal);
  const macdScaleConsistent = checkScaleConsistency(bars.length, INTERVAL);
  const macdNetOfFeeConsistent = checkNetOfFeeConsistency(macdEquity.eq, macdEquity.ret);
  
  const sanity = {
    ema_50_200: {
      original_metrics: {
        sharpe: +emaSharpeVal.toFixed(2),
        cagr_pct: +emaCagrVal.toFixed(2)
      },
      alternative_metrics: {
        sharpe: +emaAltSharpeVal.toFixed(2),
        cagr_pct: +emaAltCagrVal.toFixed(2)
      },
      sanity_checks: {
        equity_zero: emaEquityZero,
        sharpe_cagr_consistent: emaSharpeCagrConsistent,
        scale_consistent: emaScaleConsistent,
        net_of_fee_consistent: emaNetOfFeeConsistent,
        all_passed: !emaEquityZero && emaSharpeCagrConsistent && emaScaleConsistent && emaNetOfFeeConsistent
      }
    },
    macd_rsi_fusion: {
      original_metrics: {
        sharpe: +macdSharpeVal.toFixed(2),
        cagr_pct: +macdCagrVal.toFixed(2)
      },
      alternative_metrics: {
        sharpe: +macdAltSharpeVal.toFixed(2),
        cagr_pct: +macdAltCagrVal.toFixed(2)
      },
      sanity_checks: {
        equity_zero: macdEquityZero,
        sharpe_cagr_consistent: macdSharpeCagrConsistent,
        scale_consistent: macdScaleConsistent,
        net_of_fee_consistent: macdNetOfFeeConsistent,
        all_passed: !macdEquityZero && macdSharpeCagrConsistent && macdScaleConsistent && macdNetOfFeeConsistent
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
      ema_equity_zero: emaEquityZero ? "CRITICAL" : "OK",
      ema_sharpe_cagr_inconsistency: !emaSharpeCagrConsistent ? "WARNING" : "OK",
      ema_scale_mismatch: !emaScaleConsistent ? "WARNING" : "OK",
      ema_net_of_fee_inconsistency: !emaNetOfFeeConsistent ? "WARNING" : "OK",
      macd_equity_zero: macdEquityZero ? "CRITICAL" : "OK",
      macd_sharpe_cagr_inconsistency: !macdSharpeCagrConsistent ? "WARNING" : "OK",
      macd_scale_mismatch: !macdScaleConsistent ? "WARNING" : "OK",
      macd_net_of_fee_inconsistency: !macdNetOfFeeConsistent ? "WARNING" : "OK"
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
      net_of_fee_consistent: false,
      all_passed: false
    }
  }));
  process.exit(1);
}); 