// apps/web-next/src/types/backtest.ts
export interface EquityPoint { t: number; v: number }           // t: epoch ms, v: equity/value
export interface BacktestMetrics {
  totalReturnPct: number;    // 12.3
  sharpe: number;            // 1.45
  maxDrawdownPct: number;    // -6.7
  winRatePct: number;        // 54.2
  trades: number;            // 87
  avgTradePct: number;       // 0.18
  durationMs?: number;
}
export interface BacktestResult {
  equity: EquityPoint[];
  metrics: BacktestMetrics;
  logs?: string[];
}

export interface OptimizeParams {
  param: string;   // e.g. "window"
  start: number;   // e.g. 5
  end: number;     // e.g. 50
  step: number;    // e.g. 5
}

export interface OptimizeTrial {
  params: Record<string, number>;
  metrics: BacktestMetrics;
}

export interface OptimizeResult {
  best: Record<string, number>;
  trials: OptimizeTrial[];
}

// Minimal BacktestRun shape used by API route lookup
export interface BacktestRun {
  id: string | number;
  result?: BacktestResult;
  metrics?: BacktestMetrics | Record<string, number>;
  equity?: any[];
  startedAt?: string | Date;
  finishedAt?: string | Date;
  status?: string;
  artifacts?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BacktestListResponse {
  runs: BacktestRun[];
  stats: {
    total: number;
    running: number;
    queued: number;
    done: number;
    failed: number;
    p95DurationSec?: number;
  };
}