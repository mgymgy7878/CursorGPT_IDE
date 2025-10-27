import type { BacktestResult } from "@spark/backtest-core";

export interface BacktestReport {
  summary: {
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    runtimeMs: number;
    totalBars: number;
    totalTrades: number;
    guardrailBlocks: number;
  };
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    turnover: number;
    exposure: number;
    calmarRatio: number;
    sortinoRatio: number;
  };
  account: {
    initialCash: number;
    finalCash: number;
    finalEquity: number;
    totalFees: number;
    totalSlippage: number;
    positions: Record<string, number>;
  };
  equity: Array<{timestamp: number, equity: number}>;
  trades: Array<{
    timestamp: number;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    fee: number;
    slippage: number;
  }>;
}

export function generateJSONReport(result: BacktestResult, name = 'Backtest'): BacktestReport {
  const positions: Record<string, number> = {};
  for (const [symbol, quantity] of result.account.positions) {
    positions[symbol] = quantity;
  }

  const trades = result.fills.map((fill: any) => ({
    timestamp: fill.timestamp,
    symbol: fill.symbol,
    side: fill.side,
    quantity: fill.quantity,
    price: fill.price,
    fee: fill.fee,
    slippage: fill.slippage
  }));

  return {
    summary: {
      id: `bt_${Date.now()}`,
      name,
      startTime: result.config.startTime,
      endTime: result.config.endTime,
      runtimeMs: result.runtimeMs,
      totalBars: result.equity.length,
      totalTrades: result.fills.length,
      guardrailBlocks: result.guardrailBlocks
    },
    metrics: {
      ...result.metrics,
      calmarRatio: result.metrics.totalReturn / result.metrics.maxDrawdown || 0,
      sortinoRatio: 0 // Would need to calculate from returns
    },
    account: {
      initialCash: result.config.initialCash,
      finalCash: result.account.cash,
      finalEquity: result.account.equity,
      totalFees: result.account.totalFees,
      totalSlippage: result.account.totalSlippage,
      positions
    },
    equity: result.equity,
    trades
  };
} 