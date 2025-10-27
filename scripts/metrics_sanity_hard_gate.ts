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

// Enhanced Metrics Sanity Checks with Hard-Gate
function checkEquityZero(eq: number[]): boolean {
  return eq[eq.length - 1] <= 1e-6;
}

function checkSharpeCagrConsistency(sharpeVal: number, cagrVal: number): boolean {
  const sharpeSign = Math.sign(sharpeVal);
  const cagrSign = Math.sign(cagrVal);
  return sharpeSign === cagrSign;
}

function checkAnnualizationFactor(bars: number, interval: number, marketType: string = "crypto"): boolean {
  const totalMinutes = bars * (interval / 60000);
  
  let expectedAnnualization;
  if (marketType === "crypto") {
    // 7/24 market: 365 * 24 * 60 = 525,600 minutes per year
    expectedAnnualization = Math.sqrt(365 * 24 * 60);
  } else {
    // BIST: 252 trading days * 6.5 hours * 60 = 98,280 minutes per year
    expectedAnnualization = Math.sqrt(252 * 6.5 * 60);
  }
  
  const actualAnnualization = Math.sqrt((365 * 24 * 60) / totalMinutes);
  
  return Math.abs(actualAnnualization - expectedAnnualization) < 0.1;
}

function checkNetOfFeeConsistency(eq: number[], ret: number[], feeBps: number, slipBps: number): boolean {
  const cost = (feeBps + slipBps) / 10000;
  const cumulativeReturn = ret.slice(1).reduce((sum, r) => sum + r, 0);
  const finalEquity = eq[eq.length - 1];
  
  // Account for trading costs
  const netCumulativeReturn = cumulativeReturn - cost;
  const expectedEquity = Math.exp(netCumulativeReturn);
  
  return Math.abs(finalEquity - expectedEquity) < 0.1;
}

// Proper annualization calculations
function calculateSharpe(r: number[], bars: number, interval: number, marketType: string = "crypto") {
  if (r.length < 2) return 0;
  const x = r.slice(1);
  const m = x.reduce((a, b) => a + b, 0) / x.length;
  const v = x.reduce((s, u) => s + (u - m) * (u - m), 0) / x.length;
  const sd = Math.sqrt(v) + 1e-12;
  
  const totalMinutes = bars * (interval / 60000);
  let ann;
  
  if (marketType === "crypto") {
    ann = Math.sqrt((365 * 24 * 60) / totalMinutes);
  } else {
    ann = Math.sqrt((252 * 6.5 * 60) / totalMinutes);
  }
  
  return (m / sd) * ann;
}

function calculateCagr(eq: number[], bars: number, interval: number, marketType: string = "crypto") {
  const totalMinutes = bars * (interval / 60000);
  let years;
  
  if (marketType === "crypto") {
    years = totalMinutes / (365 * 24 * 60);
  } else {
    years = totalMinutes / (252 * 6.5 * 60);
  }
  
  return (Math.pow(eq[eq.length - 1], 1 / years) - 1) * 100;
}

// Test strategy with proper metrics
function testStrategyMetrics(bars: Bar[], marketType: string = "crypto") {
  const close = bars.map(b => b.c);
  const high = bars.map(b => b.h);
  const low = bars.map(b => b.l);
  
  // Simple test strategy: Buy and hold with some basic logic
  const pos = new Array(close.length).fill(0);
  for (let i = 100; i < close.length; i++) {
    if (close[i] > close[i - 1]) {
      pos[i] = 1;
    }
  }
  
  // Calculate returns with fees
  const feeBps = 10;
  const slipBps = 5;
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
  
  const sharpeVal = calculateSharpe(ret, bars.length, INTERVAL, marketType);
  const cagrVal = calculateCagr(eq, bars.length, INTERVAL, marketType);
  
  // Sanity checks
  const equityZero = checkEquityZero(eq);
  const sharpeCagrConsistent = checkSharpeCagrConsistency(sharpeVal, cagrVal);
  const annualizationConsistent = checkAnnualizationFactor(bars.length, INTERVAL, marketType);
  const netOfFeeConsistent = checkNetOfFeeConsistency(eq, ret, feeBps, slipBps);
  
  return {
    sharpe: sharpeVal,
    cagr: cagrVal,
    equity_zero: equityZero,
    sharpe_cagr_consistent: sharpeCagrConsistent,
    annualization_consistent: annualizationConsistent,
    net_of_fee_consistent: netOfFeeConsistent,
    all_passed: !equityZero && sharpeCagrConsistent && annualizationConsistent && netOfFeeConsistent
  };
}

(async () => {
  const dataPath = loadDataPath();
  const bars = readBars(dataPath);
  bars.sort((a, b) => a.ts - b.ts);
  
  // Test with crypto market assumptions
  const cryptoMetrics = testStrategyMetrics(bars, "crypto");
  
  // Test with BIST market assumptions
  const bistMetrics = testStrategyMetrics(bars, "bist");
  
  const sanity = {
    market_analysis: {
      crypto: cryptoMetrics,
      bist: bistMetrics
    },
    hard_gate_checks: {
      equity_zero: !cryptoMetrics.equity_zero && !bistMetrics.equity_zero,
      sharpe_cagr_consistent: cryptoMetrics.sharpe_cagr_consistent && bistMetrics.sharpe_cagr_consistent,
      annualization_consistent: cryptoMetrics.annualization_consistent && bistMetrics.annualization_consistent,
      net_of_fee_consistent: cryptoMetrics.net_of_fee_consistent && bistMetrics.net_of_fee_consistent,
      all_passed: cryptoMetrics.all_passed && bistMetrics.all_passed
    },
    configuration: {
      interval_ms: INTERVAL,
      total_bars: bars.length,
      total_minutes: bars.length * (INTERVAL / 60000),
      crypto_annualization: Math.sqrt(365 * 24 * 60),
      bist_annualization: Math.sqrt(252 * 6.5 * 60),
      fee_model: {
        fee_bps: 10,
        slip_bps: 5,
        total_cost_bps: 15
      }
    },
    recommendations: [
      cryptoMetrics.equity_zero ? "CRITICAL: Equity zero detected in crypto test" : null,
      bistMetrics.equity_zero ? "CRITICAL: Equity zero detected in BIST test" : null,
      !cryptoMetrics.sharpe_cagr_consistent ? "WARNING: Sharpe-CAGR inconsistency in crypto test" : null,
      !bistMetrics.sharpe_cagr_consistent ? "WARNING: Sharpe-CAGR inconsistency in BIST test" : null,
      !cryptoMetrics.annualization_consistent ? "WARNING: Annualization mismatch in crypto test" : null,
      !bistMetrics.annualization_consistent ? "WARNING: Annualization mismatch in BIST test" : null,
      !cryptoMetrics.net_of_fee_consistent ? "WARNING: Net-of-fee inconsistency in crypto test" : null,
      !bistMetrics.net_of_fee_consistent ? "WARNING: Net-of-fee inconsistency in BIST test" : null
    ].filter(Boolean)
  };
  
  fs.writeFileSync(path.join(process.argv[2], "metrics_sanity.json"), JSON.stringify(sanity, null, 2));
  
  // Hard-gate: If any critical check fails, exit with error
  if (cryptoMetrics.equity_zero || bistMetrics.equity_zero) {
    process.exit(1);
  }
})().catch(e => {
  fs.writeFileSync(path.join(process.argv[2], "metrics_sanity.json"), JSON.stringify({ 
    status: "ERROR", 
    reason: String(e),
    hard_gate_checks: {
      equity_zero: true,
      sharpe_cagr_consistent: false,
      annualization_consistent: false,
      net_of_fee_consistent: false,
      all_passed: false
    }
  }));
  process.exit(1);
}); 