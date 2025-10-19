export type BacktestStatus = 'pending' | 'running' | 'done' | 'error';

export interface BacktestRun {
  id: string;
  symbol: string;
  timeframe: string;
  status: BacktestStatus;
  startedAt?: string;
  finishedAt?: string;
  metrics?: Record<string, number | string | boolean>;
}

export interface BacktestListResponse {
  items: BacktestRun[];
  total: number;
}


