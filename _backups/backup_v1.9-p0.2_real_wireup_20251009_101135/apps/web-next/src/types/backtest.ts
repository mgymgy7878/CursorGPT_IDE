export type BacktestStatus = "queued" | "running" | "done" | "failed";

export type BacktestRun = {
  id: string;
  startedAt: string;              // ISO
  finishedAt?: string;            // ISO
  status: BacktestStatus;
  metrics: {
    auc?: number;
    sharpe?: number;
    maxDrawdown?: number;         // -0.23 gibi
    winRate?: number;             // 0..1
    pnl?: number;                 // toplam PnL (opsiyonel)
  };
  equity?: Array<[number, number]>; // [ts, equity]
  artifacts?: {
    equityCsv?: string;           // API proxy ile servis edilir
    tradesCsv?: string;
    reportPdf?: string;
  };
  notes?: string;
};

export type BacktestListResponse = {
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
};

export type BacktestSseEvent =
  | { event: "snapshot"; data: BacktestListResponse }
  | { event: "update"; data: BacktestListResponse }
  | { event: "ping" };

