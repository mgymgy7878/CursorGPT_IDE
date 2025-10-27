export function normalizeThresholds(t) {
    return {
        maxNotional: Number(t?.maxNotional ?? 0),
        maxDrawdownPct: Number(t?.maxDrawdownPct ?? 100),
        maxLatencyMs: Number(t?.maxLatencyMs ?? 1_000)
    };
}
