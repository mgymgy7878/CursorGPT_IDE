export type StrategyStatus = "draft" | "running" | "stopped" | "error";

export interface Strategy {
  id: string;
  name: string;
  symbol: string;        // BTCUSDT vb.
  category?: string;
  createdAt: string;     // ISO
  updatedAt?: string;
  status: StrategyStatus;
}

export interface CreateStrategyDto {
  name: string;
  symbol: string;
  code: string;          // editor içeriği
  category?: string;
}

export interface RunningStrategy extends Strategy {
  startedAt: string;           // ISO
  pnl: number;                 // anlık unrealized P/L
  trades: number;              // son 24h işlem sayısı
  symbol: string;
  latencyMs?: number;
}

export type StrategyWsEvent =
  | { type: "status"; id: string; status: StrategyStatus }
  | { type: "pnl"; id: string; pnl: number; ts: number }
  | { type: "trade"; id: string; ts: number; price: number; qty: number }
  | { type: "latency"; id: string; p95: number };
