import type { BacktestResult } from "./sim";

export interface Metrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
  totalTrades: number;
}

export function calculateMetrics(result: BacktestResult): Metrics {
  const { totalReturn, sharpeRatio, maxDrawdown, winRate, profitFactor, averageTrade, totalTrades } = result;
  
  return {
    totalReturn,
    sharpeRatio,
    maxDrawdown,
    winRate,
    profitFactor,
    averageTrade,
    totalTrades
  };
}

export function calculateDrawdown(equity: number[]): number {
  let maxDrawdown = 0;
  let peak = equity[0] || 0;
  
  for (const value of equity) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = peak > 0 ? (peak - value) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

export function calculateSharpeRatio(returns: number[]): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev > 0 ? avgReturn / stdDev : 0;
}

export function calculateSortinoRatio(returns: number[], riskFreeRate = 0.02): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const negativeReturns = returns.filter(r => r < 0);
  
  if (negativeReturns.length === 0) return Infinity;
  
  const downsideVariance = negativeReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / returns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  if (downsideDeviation === 0) return 0;
  
  return (avgReturn - riskFreeRate / 252) / downsideDeviation * Math.sqrt(252);
}

export function calculateCalmarRatio(totalReturn: number, maxDrawdown: number): number {
  if (maxDrawdown === 0) return 0;
  return totalReturn / maxDrawdown;
}

export function calculateWinRateFromFills(fills: Array<{ side: 'BUY' | 'SELL'; symbol: string; price: number }>): number {
  const trades = fills.filter(f => f.side === 'SELL');
  if (trades.length === 0) return 0;
  
  const winningTrades = trades.filter(trade => {
    const buyFills = fills.filter(f => f.side === 'BUY' && f.symbol === trade.symbol);
    const avgBuyPrice = buyFills.reduce((sum, f) => sum + f.price, 0) / (buyFills.length || 1);
    return trade.price > avgBuyPrice;
  }).length;
  
  return winningTrades / trades.length;
}

export function calculateTurnoverFromFills(fills: Array<{ quantity: number; price: number }>, initialCash: number): number {
  const totalVolume = fills.reduce((sum, f) => sum + f.quantity * f.price, 0);
  return initialCash > 0 ? totalVolume / initialCash : 0;
}

export function calculateExposureFromPositions(positions: Map<string, number>): number {
  return positions.size > 0 ? 1 : 0;
} 