// Multi-Asset Portfolio Backtests
// Supports 2-10 assets with correlation analysis and diversification metrics

export type PortfolioConfig = {
  symbols: string[];              // 2-10 assets
  weights?: number[];             // Optional (equal weight if not provided)
  rebalance?: 'none' | 'daily' | 'weekly';  // MVP: 'none'
  correlation: {
    enabled: boolean;
    threshold: number;            // e.g., 0.7 (high correlation warning)
  };
};

export type PortfolioResult = {
  symbols: string[];
  weights: number[];
  combined: {
    sharpe: number;
    winRate: number;
    ddMax: number;
    pnl: number;
    trades: number;
    equityCurve?: number[];       // Optional for UI
  };
  individual: Array<{
    symbol: string;
    weight: number;
    sharpe: number;
    winRate: number;
    pnl: number;
    trades: number;
    equityCurve?: number[];       // Optional for UI
  }>;
  correlation: {
    matrix: number[][];           // NxN symmetric matrix
    avgCorrelation: number;
    diversificationBenefit: number;  // portfolio_sharpe - avg_individual_sharpe
  };
  timing: {
    commonTimestamps: number;     // Intersection count
    totalCandles: number;         // Sum across all symbols
  };
};

type BacktestMetrics = {
  sharpe: number;
  winRate: number;
  ddMax: number;
  pnl: number;
  trades: number;
  equity: number[];
  returns: number[];              // For correlation
};

/**
 * Validate portfolio weights
 */
export function validateWeights(symbols: string[], weights?: number[]): number[] {
  const n = symbols.length;
  
  if (!weights || weights.length === 0) {
    // Equal weight default
    return Array(n).fill(1 / n);
  }
  
  if (weights.length !== n) {
    throw new Error(`Weights length (${weights.length}) must match symbols length (${n})`);
  }
  
  const sum = weights.reduce((a, b) => a + b, 0);
  const tolerance = 1e-6;
  
  if (Math.abs(sum - 1.0) > tolerance) {
    throw new Error(`Weights must sum to 1.0 (got ${sum.toFixed(6)})`);
  }
  
  return weights;
}

/**
 * Align timestamps across multiple symbol datasets
 * Returns intersection of all timestamps
 */
export function alignTimestamps(
  candlesBySymbol: Map<string, any[]>
): { aligned: Map<string, any[]>; commonTimestamps: number[] } {
  const symbols = Array.from(candlesBySymbol.keys());
  
  if (symbols.length === 0) {
    return { aligned: new Map(), commonTimestamps: [] };
  }
  
  // Get all timestamp sets
  const timestampSets = symbols.map(sym => {
    const candles = candlesBySymbol.get(sym) || [];
    return new Set(candles.map(c => c.t || c.ts));
  });
  
  // Find intersection
  let commonTimestamps = Array.from(timestampSets[0]);
  for (let i = 1; i < timestampSets.length; i++) {
    commonTimestamps = commonTimestamps.filter(t => timestampSets[i].has(t));
  }
  
  commonTimestamps.sort((a, b) => a - b);
  
  // Filter candles to common timestamps
  const aligned = new Map<string, any[]>();
  const commonSet = new Set(commonTimestamps);
  
  for (const sym of symbols) {
    const candles = candlesBySymbol.get(sym) || [];
    const filtered = candles.filter(c => commonSet.has(c.t || c.ts));
    
    // Forward-fill missing (max 1 step)
    const filled: any[] = [];
    let lastCandle: any = null;
    
    for (const ts of commonTimestamps) {
      const candle = filtered.find(c => (c.t || c.ts) === ts);
      if (candle) {
        filled.push(candle);
        lastCandle = candle;
      } else if (lastCandle && filled.length < commonTimestamps.length) {
        // Forward-fill (max 1 step)
        filled.push({ ...lastCandle, t: ts, ts });
      }
    }
    
    aligned.set(sym, filled);
  }
  
  return { aligned, commonTimestamps };
}

/**
 * Calculate log returns for correlation
 */
export function calculateLogReturns(closes: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      returns.push(Math.log(closes[i] / closes[i - 1]));
    } else {
      returns.push(0); // Handle zero prices
    }
  }
  return returns;
}

/**
 * Calculate Pearson correlation coefficient
 */
export function calculateCorrelation(returns1: number[], returns2: number[]): number {
  const n = Math.min(returns1.length, returns2.length);
  if (n === 0) return 0;
  
  const mean1 = returns1.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const mean2 = returns2.slice(0, n).reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    sum1Sq += diff1 * diff1;
    sum2Sq += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Calculate correlation matrix (NxN, symmetric)
 */
export function calculateCorrelationMatrix(
  returns: Map<string, number[]>
): { matrix: number[][]; avgCorrelation: number } {
  const symbols = Array.from(returns.keys());
  const n = symbols.length;
  
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0; // Diagonal
      } else if (i < j) {
        const corr = calculateCorrelation(
          returns.get(symbols[i]) || [],
          returns.get(symbols[j]) || []
        );
        matrix[i][j] = corr;
        matrix[j][i] = corr; // Symmetric
        sum += Math.abs(corr);
        count++;
      }
    }
  }
  
  const avgCorrelation = count > 0 ? sum / count : 0;
  
  return { matrix, avgCorrelation };
}

/**
 * Run portfolio backtest
 */
export function runPortfolioBacktest<T>(
  candlesBySymbol: Map<string, any[]>,
  backtestFn: (bars: any[], config: T) => BacktestMetrics,
  strategyConfig: T,
  portfolioConfig: PortfolioConfig
): PortfolioResult {
  const symbols = portfolioConfig.symbols;
  const weights = validateWeights(symbols, portfolioConfig.weights);
  
  // Align timestamps
  const { aligned, commonTimestamps } = alignTimestamps(candlesBySymbol);
  
  if (commonTimestamps.length === 0) {
    throw new Error('No common timestamps found across symbols');
  }
  
  // Run individual backtests
  const individualResults: BacktestMetrics[] = [];
  const returns = new Map<string, number[]>();
  
  for (const sym of symbols) {
    const candles = aligned.get(sym) || [];
    if (candles.length === 0) {
      throw new Error(`No aligned candles for symbol: ${sym}`);
    }
    
    const result = backtestFn(candles, strategyConfig);
    individualResults.push(result);
    
    // Calculate log returns for correlation
    const closes = candles.map(c => c.c || c.close);
    returns.set(sym, calculateLogReturns(closes));
  }
  
  // Calculate combined portfolio equity
  const maxLength = Math.max(...individualResults.map(r => r.equity.length));
  const combinedEquity: number[] = Array(maxLength).fill(0);
  
  for (let i = 0; i < maxLength; i++) {
    for (let j = 0; j < symbols.length; j++) {
      const equity = individualResults[j].equity[i] || 10000;
      combinedEquity[i] += (equity - 10000) * weights[j];
    }
    combinedEquity[i] += 10000; // Add back initial capital
  }
  
  // Calculate combined metrics
  const combinedReturns = calculateLogReturns(combinedEquity);
  const avgReturn = combinedReturns.reduce((a, b) => a + b, 0) / Math.max(1, combinedReturns.length);
  const stdDev = Math.sqrt(
    combinedReturns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / Math.max(1, combinedReturns.length)
  );
  const combinedSharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  
  // Portfolio metrics
  let peakEq = 10000;
  let maxDD = 0;
  for (const eq of combinedEquity) {
    peakEq = Math.max(peakEq, eq);
    maxDD = Math.max(maxDD, peakEq > 0 ? (peakEq - eq) / peakEq : 0);
  }
  
  const totalTrades = individualResults.reduce((sum, r) => sum + r.trades, 0);
  const totalWins = individualResults.reduce((sum, r) => sum + r.trades * r.winRate, 0);
  const combinedWinRate = totalTrades > 0 ? totalWins / totalTrades : 0;
  
  // Correlation analysis
  const { matrix: correlationMatrix, avgCorrelation } = portfolioConfig.correlation.enabled
    ? calculateCorrelationMatrix(returns)
    : { matrix: [], avgCorrelation: 0 };
  
  // Diversification benefit
  const avgIndividualSharpe =
    individualResults.reduce((sum, r) => sum + r.sharpe, 0) / symbols.length;
  const diversificationBenefit = combinedSharpe - avgIndividualSharpe;
  
  return {
    symbols,
    weights,
    combined: {
      sharpe: combinedSharpe,
      winRate: combinedWinRate,
      ddMax: maxDD * 100,
      pnl: combinedEquity[combinedEquity.length - 1] - 10000,
      trades: totalTrades,
      equityCurve: combinedEquity,
    },
    individual: symbols.map((sym, i) => ({
      symbol: sym,
      weight: weights[i],
      sharpe: individualResults[i].sharpe,
      winRate: individualResults[i].winRate,
      pnl: individualResults[i].pnl,
      trades: individualResults[i].trades,
      equityCurve: individualResults[i].equity,
    })),
    correlation: {
      matrix: correlationMatrix,
      avgCorrelation,
      diversificationBenefit,
    },
    timing: {
      commonTimestamps: commonTimestamps.length,
      totalCandles: Array.from(candlesBySymbol.values()).reduce((sum, arr) => sum + arr.length, 0),
    },
  };
}

