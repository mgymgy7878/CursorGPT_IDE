import type { BacktestParams, BacktestResult } from "@spark/shared";

function generateFixtureBars(params: BacktestParams) {
  const count = Math.max(1, params.barCount ?? 1000);
  const start = Date.now() - count * 60_000;
  const data = Array.from({ length: count }, (_, i) => {
    const t = new Date(start + i * 60_000).toISOString();
    const price = 100 + Math.sin(i / 25) * 2 + Math.random() * 0.5;
    return { timestamp: t, price };
  });
  return data;
}

export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  const chartData = generateFixtureBars(params);
  const equity = chartData.map((p, idx) => ({ timestamp: p.timestamp, value: 10000 + idx * 2 - Math.max(0, Math.sin(idx / 40)) * 10 }));
  const trades = chartData.filter((_, i) => i % 200 === 0).map(p => ({ timestamp: p.timestamp, type: (Math.random() > 0.5 ? 'BUY' : 'SELL') as 'BUY' | 'SELL', price: p.price }));
  const lastEquity = equity[equity.length - 1];
  const result: BacktestResult = {
    totalReturn: lastEquity ? (lastEquity.value - 10000) / 10000 : 0,
    maxDrawdown: 0.1,
    winRate: 0.55,
    totalTrades: trades.length,
    sharpeRatio: 1.2,
    chartData,
    trades,
    equity,
  };
  return result;
} 
