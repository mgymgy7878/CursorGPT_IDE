export type BacktestStatus = "queued" | "running" | "done" | "failed";

export interface BacktestRun {
  id: string;
  status: BacktestStatus;
  startedAt: number;  // timestamp ms
  finishedAt?: number;  // timestamp ms
  notes?: string;
  equity?: Array<[number, number]>;  // [ts, value]
  artifacts?: Array<{
    type: "csv" | "pdf";
    path: string;
  }>;
  metrics?: {
    auc?: number;
    sharpe?: number;
    maxDrawdown?: number;
    winRate?: number;
    pnl?: number;
  };
}

export interface BacktestStatusResponse {
  runs: BacktestRun[];
  stats: {
    total: number;
    running: number;
    queued: number;
    done: number;
    failed: number;
    p50DurationSec?: number;
    p95DurationSec?: number;
  };
}

