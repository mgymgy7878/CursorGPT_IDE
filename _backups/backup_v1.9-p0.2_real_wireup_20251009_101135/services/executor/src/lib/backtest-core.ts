import type { StrategyV1, BacktestMetrics } from "@spark/types";

export async function runBacktestCore(input: {
  strategy: StrategyV1;
  symbol: string;
  interval: string;
  start?: number;
  end?: number;
  fees?: number;
  slippage?: number;
  onEvent: (ev: any) => void;
}): Promise<{ metrics: BacktestMetrics & { latencyP95Ms?: number }; trades?: any[]; equity?: Array<[number, number]> }> {
  const steps = 30;
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, 80));
    input.onEvent({ event: "progress", step: i, of: steps });
    if (i % 5 === 0)
      input.onEvent({ event: "equityPoint", t: Date.now() + i * 60000, v: 10000 + i * 5 });
  }
  const metrics: BacktestMetrics & { latencyP95Ms?: number } = {
    pnlPct: 0.064,
    mddPct: -0.031,
    sharpe: 1.05,
    winRate: 0.53,
    trades: 37,
    profitFactor: 1.28,
    latencyP95Ms: 170,
  };
  const equity = Array.from({ length: steps }, (_, k) => [Date.now() + k * 60000, 10000 + k * 5]) as Array<[
    number,
    number
  ]>;
  return { metrics, equity };
}


