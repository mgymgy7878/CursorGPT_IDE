export interface BacktestMetrics {
  pnlPct: number;
  mddPct: number;
  sharpe: number;
  winRate: number;
  trades: number;
  profitFactor: number;
  latencyP95Ms?: number;
}


