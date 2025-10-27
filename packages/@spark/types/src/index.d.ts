export type UUID = string & {
    readonly __brand: "UUID";
};
export type Price = number & {
    readonly __brand: "Price";
};
export type Quantity = number & {
    readonly __brand: "Quantity";
};
export type Symbol = string & {
    readonly __brand: "Symbol";
};
export type OrderId = string & {
    readonly __brand: "OrderId";
};
export declare function asPrice(value: number): Price;
export declare function asQuantity(value: number): Quantity;
export declare function asSymbol(value: string): Symbol;
export declare function asOrderId(value: string): OrderId;
export declare function asUUID(value: string): UUID;
export type Exchange = "BINANCE" | "BIST" | "BYBIT" | "FOREX";
export type ExecutionMode = "paper" | "live";
export interface Clock {
    now(): number;
}
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
export type NumberBool = number | boolean;
export interface StrategyV1 {
    version: "v1";
    name: string;
    params: Record<string, NumberBool>;
    risk: {
        leverage: number;
        notionalPct: number;
    };
    entries: Array<{
        when: string;
    }>;
    exits?: {
        tpPct?: number;
        slPct?: number;
    };
}
export interface BacktestMetrics {
    pnlPct: number;
    mddPct: number;
    sharpe: number;
    winRate: number;
    trades: number;
    profitFactor: number;
}
//# sourceMappingURL=index.d.ts.map