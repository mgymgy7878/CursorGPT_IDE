export interface CanaryThresholds {
  maxNotional?: number;
  maxDrawdownPct?: number;   // 0–100
  maxLatencyMs?: number;
}
export function normalizeThresholds(t: Partial<CanaryThresholds> | undefined): Required<CanaryThresholds> {
  return {
    maxNotional: Number(t?.maxNotional ?? 0),
    maxDrawdownPct: Number(t?.maxDrawdownPct ?? 100),
    maxLatencyMs: Number(t?.maxLatencyMs ?? 1_000)
  };
}
