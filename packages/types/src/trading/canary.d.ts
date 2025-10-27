import type { CanaryThresholds } from "./thresholds.js";
export interface CanaryGates {
    risk: boolean;
    gateOpen: boolean;
    reason?: string;
    thresholds: CanaryThresholds;
}
export interface CanaryRunResponse {
    id: string;
    startedAt: string;
    durationMs: number;
    gates: CanaryGates;
    placed?: number;
    fills?: number;
    errors?: number;
}
export declare function normalizeCanaryResponse(input: any): CanaryRunResponse;
