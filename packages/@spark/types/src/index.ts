/* eslint-disable no-restricted-imports */

export type UUID = string & { readonly __brand: "UUID" };
export type Price = number & { readonly __brand: "Price" };
export type Quantity = number & { readonly __brand: "Quantity" };
export type Symbol = string & { readonly __brand: "Symbol" };
export type OrderId = string & { readonly __brand: "OrderId" };

// Branded type helpers
export function asPrice(value: number): Price {
  return value as Price;
}

export function asQuantity(value: number): Quantity {
  return value as Quantity;
}

export function asSymbol(value: string): Symbol {
  return value as Symbol;
}

export function asOrderId(value: string): OrderId {
  return value as OrderId;
}

export function asUUID(value: string): UUID {
  return value as UUID;
}

export type Exchange = "BINANCE" | "BIST" | "BYBIT" | "FOREX";
export type ExecutionMode = "paper" | "live";

export interface Clock { now(): number; }

export interface StrategyConfig {
  id: UUID;
  name: string;
  symbol: Symbol;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  mode: ExecutionMode;
  params: Record<string, number | string | boolean>;
}

export type Role = "admin" | "trader" | "viewer";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthUser {
  id: UUID;
  email: string;
  roles: Role[];
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface StrategySummary {
  id: UUID;
  name: string;
  symbol: Symbol;
  status: "active" | "paused";
}

export * from "./canary";
export * from "./events"; 
export * from "./metrics";
export * from "./futures";

// Missing exports for executor
export type FillEvent = {
  id: string;
  symbol: Symbol;
  side: "BUY" | "SELL";
  quantity: Quantity;
  price: Price;
  timestamp: number;
};

export function mapVendorFillEvent(event: any): FillEvent {
  return {
    id: event.id || event.orderId,
    symbol: asSymbol(event.symbol),
    side: event.side,
    quantity: asQuantity(event.quantity || event.qty),
    price: asPrice(event.price),
    timestamp: event.timestamp || Date.now()
  };
}

export function isFillEvent(event: any): event is FillEvent {
  return event && typeof event.id === 'string' && event.symbol && event.side;
}

export function normalizeCanaryResponse(input: any): any {
  return {
    success: input.success || false,
    metrics: input.metrics || {},
    warnings: input.warnings || [],
    errors: input.errors || []
  };
}

export type CanaryRunResponse = {
  success: boolean;
  metrics: Record<string, any>;
  warnings: string[];
  errors: string[];
};

export type CanaryRunResponseInput = {
  strategy: StrategyV1;
  symbol: Symbol;
  timeframe: string;
  startDate: string;
  endDate: string;
};

export type CanaryConfirmRequest = {
  strategyId: string;
  symbol: Symbol;
  confirm: boolean;
};

export type CanaryConfirmResponse = {
  confirmed: boolean;
  message: string;
};

export type CanaryGates = {
  riskCheck: boolean;
  backtestPass: boolean;
  paperTradePass: boolean;
};

export type CanaryThresholds = {
  minWinRate: number;
  maxDrawdown: number;
  minSharpe: number;
};

export function normalizeThresholds(input: any): CanaryThresholds {
  return {
    minWinRate: input.minWinRate || 0.5,
    maxDrawdown: input.maxDrawdown || 0.2,
    minSharpe: input.minSharpe || 1.0
  };
}

export type LiveTradeApplyRequest = {
  strategyId: string;
  symbol: Symbol;
  mode: "paper" | "live";
};

export type LiveTradeApplyResponse = {
  applied: boolean;
  message: string;
  tradeId?: string;
};

export type LiveTradePlanRequest = {
  strategyId: string;
  symbol: Symbol;
  timeframe: string;
};

export type LiveTradePlanResponse = {
  plan: {
    entries: any[];
    exits: any[];
    risk: any;
  };
  ready: boolean;
};

export type CanaryRunRequest = {
  strategy: StrategyV1;
  symbol: Symbol;
  timeframe: string;
  startDate: string;
  endDate: string;
};
// Strategy DSL v1 (kept minimal here)
export type NumberBool = number | boolean;
export interface StrategyV1 {
  version: "v1";
  name: string;
  params: Record<string, NumberBool>;
  risk: { leverage: number; notionalPct: number };
  entries: Array<{ when: string }>;
  exits?: { tpPct?: number; slPct?: number };
}

export interface BacktestMetrics {
  pnlPct: number;
  mddPct: number;
  sharpe: number;
  winRate: number;
  trades: number;
  profitFactor: number;
}