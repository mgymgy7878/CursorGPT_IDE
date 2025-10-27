export type { Bar, toEpochMs, isBar } from "@spark/types";

export interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timestamp: number;
}

export interface Fill {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: number;
  fee: number;
  slippage: number;
}

export interface Account {
  cash: number;
  positions: Map<string, number>;
  equity: number;
  pnl: number;
  totalFees: number;
  totalSlippage: number;
}

export interface FeeSlipConfig {
  feeRate: number; // 0.001 = 0.1%
  slippageBps: number; // 1 = 1 basis point
  latencyMs: number; // 50ms
}

export interface BacktestConfig {
  initialCash: number;
  feeConfig: FeeSlipConfig;
  startTime: number;
  endTime: number;
  seed?: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  account: Account;
  fills: Fill[];
  equity: Array<{timestamp: number, equity: number}>;
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    turnover: number;
    exposure: number;
  };
  guardrailBlocks: number;
  runtimeMs: number;
} 