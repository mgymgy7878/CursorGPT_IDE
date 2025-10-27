import type { BacktestResult } from "@spark/backtest-core";

export function generateEquityPlot(result: BacktestResult, width = 80, height = 20): string {
  if (result.equity.length === 0) {
    return 'No equity data available';
  }

  const equityValues = result.equity.map((e: {equity: number}) => e.equity);
  const minEquity = Math.min(...equityValues);
  const maxEquity = Math.max(...equityValues);
  const range = maxEquity - minEquity;

  if (range === 0) {
    return 'No equity variation';
  }

  const lines: string[] = [];
  lines.push('Equity Curve');
  lines.push('='.repeat(width));
  
  // Create ASCII plot
  for (let y = height - 1; y >= 0; y--) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const equityIndex = Math.floor((x / width) * (result.equity.length - 1));
      const equity = result.equity[equityIndex]?.equity || minEquity;
      const normalizedY = (equity - minEquity) / range;
      const plotY = Math.floor(normalizedY * height);
      
      if (plotY === y) {
        line += '*';
      } else if (plotY > y) {
        line += ' ';
      } else {
        line += ' ';
      }
    }
    lines.push(line);
  }
  
  lines.push('='.repeat(width));
  lines.push(`Min: $${minEquity.toFixed(2)} | Max: $${maxEquity.toFixed(2)} | Range: $${range.toFixed(2)}`);
  lines.push(`Total Return: ${(result.metrics.totalReturn * 100).toFixed(2)}% | Max DD: ${(result.metrics.maxDrawdown * 100).toFixed(2)}%`);
  
  return lines.join('\n');
}

export function generateSimpleEquityReport(result: BacktestResult): string {
  const lines: string[] = [];
  lines.push('EQUITY CURVE REPORT');
  lines.push('==================');
  lines.push('');
  
  if (result.equity.length === 0) {
    lines.push('No equity data available');
    return lines.join('\n');
  }
  
  const equityValues = result.equity.map((e: {equity: number}) => e.equity);
  const minEquity = Math.min(...equityValues);
  const maxEquity = Math.max(...equityValues);
  const finalEquity = result.equity[result.equity.length - 1]?.equity || 0;
  
  lines.push(`Initial Equity: $${result.config.initialCash.toFixed(2)}`);
  lines.push(`Final Equity: $${finalEquity.toFixed(2)}`);
  lines.push(`Min Equity: $${minEquity.toFixed(2)}`);
  lines.push(`Max Equity: $${maxEquity.toFixed(2)}`);
  lines.push(`Total Return: ${(result.metrics.totalReturn * 100).toFixed(2)}%`);
  lines.push(`Max Drawdown: ${(result.metrics.maxDrawdown * 100).toFixed(2)}%`);
  lines.push(`Sharpe Ratio: ${result.metrics.sharpeRatio.toFixed(2)}`);
  lines.push(`Win Rate: ${(result.metrics.winRate * 100).toFixed(2)}%`);
  lines.push(`Total Trades: ${result.fills.length}`);
  lines.push(`Guardrail Blocks: ${result.guardrailBlocks}`);
  lines.push(`Runtime: ${result.runtimeMs}ms`);
  
  return lines.join('\n');
} 