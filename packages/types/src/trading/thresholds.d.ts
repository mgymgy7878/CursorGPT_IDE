export interface CanaryThresholds {
    maxNotional?: number;
    maxDrawdownPct?: number;
    maxLatencyMs?: number;
}
export declare function normalizeThresholds(t: Partial<CanaryThresholds> | undefined): Required<CanaryThresholds>;
