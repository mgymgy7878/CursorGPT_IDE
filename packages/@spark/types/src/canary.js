/** Esnek→katı dönüşüm: eksikleri doldur, tüm numerikleri sayıya çevir */
export const normalizeCanaryResponse = (r) => {
    const m = r?.metrics ?? {};
    const n = (x, d = 0) => (typeof x === "number" ? x : Number(x ?? d)) || d;
    const metrics = {
        ack_p95_ms: n(m.ack_p95_ms, 1000),
        event_to_db_p95_ms: n(m.event_to_db_p95_ms, 300),
        ingest_lag_p95_s: n(m.ingest_lag_p95_s, 2),
        slippage_p95_bps: n(m.slippage_p95_bps, 20),
        seq_gap_total: n(m.seq_gap_total, 0), // ← garanti sayı
        samples: n(m.samples, 0),
        started_at: m.started_at,
        finished_at: m.finished_at,
        errors: Array.isArray(m.errors) ? m.errors : undefined
    };
    return {
        ok: !!r.ok,
        run_id: String(r.run_id ?? "unknown"),
        metrics,
        notes: r.notes,
        meta: r.meta
    };
};
export const CANARY_THRESHOLDS = {
    ack_p95_ms: 1000, event_to_db_p95_ms: 300, ingest_lag_p95_s: 2,
    seq_gap_total: 0, slippage_p95_bps: 25, clock_drift_ms_p95: 500,
};
export function normalizeThresholds(partial) {
    return {
        ...CANARY_THRESHOLDS,
        ...partial
    };
}
//# sourceMappingURL=canary.js.map