import type { BacktestResult } from "@spark/backtest-core";

export function generateCSVReport(result: BacktestResult): string {
  const lines: string[] = [];
  
  // Summary section
  lines.push('Summary');
  lines.push('Metric,Value');
  lines.push(`Total Return,${(result.metrics.totalReturn * 100).toFixed(2)}%`);
  lines.push(`Sharpe Ratio,${result.metrics.sharpeRatio.toFixed(2)}`);
  lines.push(`Max Drawdown,${(result.metrics.maxDrawdown * 100).toFixed(2)}%`);
  lines.push(`Win Rate,${(result.metrics.winRate * 100).toFixed(2)}%`);
  lines.push(`Turnover,${result.metrics.turnover.toFixed(2)}`);
  lines.push(`Exposure,${result.metrics.exposure.toFixed(2)}`);
  lines.push(`Runtime (ms),${result.runtimeMs}`);
  lines.push(`Total Trades,${result.fills.length}`);
  lines.push(`Guardrail Blocks,${result.guardrailBlocks}`);
  lines.push('');
  
  // Account section
  lines.push('Account');
  lines.push('Metric,Value');
  lines.push(`Initial Cash,${result.config.initialCash.toFixed(2)}`);
  lines.push(`Final Cash,${result.account.cash.toFixed(2)}`);
  lines.push(`Final Equity,${result.account.equity.toFixed(2)}`);
  lines.push(`Total Fees,${result.account.totalFees.toFixed(2)}`);
  lines.push(`Total Slippage,${result.account.totalSlippage.toFixed(2)}`);
  lines.push('');
  
  // Positions section
  lines.push('Positions');
  lines.push('Symbol,Quantity');
  for (const [symbol, quantity] of result.account.positions) {
    lines.push(`${symbol},${quantity.toFixed(6)}`);
  }
  lines.push('');
  
  // Equity curve
  lines.push('Equity Curve');
  lines.push('Timestamp,Equity');
  for (const point of result.equity) {
    const date = new Date(point.timestamp).toISOString();
    lines.push(`${date},${point.equity.toFixed(2)}`);
  }
  lines.push('');
  
  // Trades
  lines.push('Trades');
  lines.push('Timestamp,Symbol,Side,Quantity,Price,Fee,Slippage');
  for (const fill of result.fills) {
    const date = new Date(fill.timestamp).toISOString();
    lines.push(`${date},${fill.symbol},${fill.side},${fill.quantity.toFixed(6)},${fill.price.toFixed(2)},${fill.fee.toFixed(2)},${fill.slippage.toFixed(2)}`);
  }
  
  return lines.join('\n');
} 