import type { CanaryThresholds } from "./thresholds.js";
export interface CanaryRunRequest {
    symbols: string[];
    mode: "paper" | "live";
    duration?: string | number;
    thresholds?: CanaryThresholds;
}
export interface CanaryConfirmRequest {
    runId: string;
    approve: boolean;
    reason?: string;
}
export interface CanaryConfirmResponse {
    runId: string;
    approved: boolean;
    ok?: boolean;
    reason?: string;
    ts?: string;
    gates?: {
        gateOpen: boolean;
        reason?: string;
    };
}
export interface LiveTradePlanRequest {
    symbols: string[];
    notional?: number;
    constraints?: CanaryThresholds;
}
export interface LiveTradePlanResponse {
    id: string;
    entries: Array<{
        symbol: string;
        side: "BUY" | "SELL";
        qty: number;
    }>;
    etaMs?: number;
    ok?: boolean;
    message?: string;
    errors?: number;
}
export interface LiveTradeApplyRequest {
    planId: string;
    confirm?: boolean;
}
export interface LiveTradeApplyResponse {
    planId: string;
    placed: number;
    ok?: boolean;
    message?: string;
    errors?: number;
}
