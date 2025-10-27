/** Legacy/raw metrik giriş tipi (opsiyoneller) */
export type CanaryRunMetricsInput = {
    ack_p95_ms?: number | string;
    event_to_db_p95_ms?: number | string;
    ingest_lag_p95_s?: number | string;
    slippage_p95_bps?: number | string;
    seq_gap_total?: number | string;
    samples?: number | string;
    started_at?: string | number;
    finished_at?: string | number;
    errors?: string[];
};
/** Normalize edilmiş metrikler — TÜM alanlar sayısal ve `seq_gap_total` ZORUNLU */
export type CanaryRunMetrics = {
    ack_p95_ms: number;
    event_to_db_p95_ms: number;
    ingest_lag_p95_s: number;
    slippage_p95_bps: number;
    seq_gap_total: number;
    samples: number;
    started_at?: string | number;
    finished_at?: string | number;
    errors?: string[];
};
export type CanaryRunResponse = {
    ok: boolean;
    run_id: string;
    metrics: CanaryRunMetrics;
    notes?: string;
    meta?: Record<string, unknown>;
};
export type CanaryRunResponseInput = {
    ok?: boolean;
    run_id?: string | number;
    metrics?: CanaryRunMetricsInput;
    notes?: string;
    meta?: Record<string, unknown>;
};
/** Esnek→katı dönüşüm: eksikleri doldur, tüm numerikleri sayıya çevir */
export declare const normalizeCanaryResponse: (r: CanaryRunResponseInput) => CanaryRunResponse;
export type CanaryGates = {
    ack_p95_ms?: number | "unknown";
    event_to_db_p95_ms?: number | "unknown";
    ingest_lag_p95_s?: number | "unknown";
    seq_gap_total?: number | "unknown";
    slippage_p95_bps?: number | "unknown";
    clock_drift_ms_p95?: number | "unknown";
};
export type CanaryEvidencePaths = {
    root: string;
    plan: string;
    metrics: string;
    latency: string;
    audit: string;
};
export type CanaryResult = {
    nonce: string;
    status: "ARMED" | "WARNING" | "BLOCKED";
    step: 1;
    observed_signals: number;
    gates: CanaryGates;
    decision: "GO→Step1" | "HOLD";
    evidence: CanaryEvidencePaths;
    reason?: string;
};
export type CanaryRunRequest = {
    dryRun?: boolean;
};
export type CanaryConfirmRequest = {
    nonce?: string;
    mode?: "shadow" | "live";
    allowLive?: boolean;
    dryRun?: boolean;
};
export type CanaryConfirmResponse = {
    nonce: string;
    mode: "shadow" | "live";
    accepted: boolean;
    reason: string;
    tokenVerified: boolean;
    wouldDo: {
        action: "none" | "shadow-trade" | "live-trade";
        symbol?: string;
        qty?: number;
        side?: "BUY" | "SELL";
    };
    evidence: {
        root: string;
        confirm: string;
    };
};
export type LiveTradePlanRequest = {
    nonce?: string;
    symbol?: string;
    qty?: number;
    side?: "BUY" | "SELL";
    mode?: "live";
    allowLive?: boolean;
    dryRun?: boolean;
};
export type LiveTradePlanResponse = {
    nonce: string;
    accepted: boolean;
    reason: string;
    gatesOk: boolean;
    tokenVerified: boolean;
    rbacOk: boolean;
    killSwitch: boolean;
    notionalOk: boolean;
    wouldPlace: {
        symbol: string;
        qty: number;
        side: "BUY" | "SELL";
        notional_usdt: number;
    } | null;
    evidence: {
        root: string;
        live_plan: string;
    };
};
export type LiveTradeApplyRequest = {
    nonce?: string;
    symbol: string;
    qty: number;
    side: "BUY" | "SELL";
    allowLive: true;
    idempotencyKey?: string;
    traceparent?: string;
};
export type LiveTradeApplyResponse = {
    nonce: string;
    accepted: boolean;
    reason: string;
    tokenVerified: boolean;
    rbacOk: boolean;
    killSwitch: boolean;
    gatesOk: boolean;
    notionalOk: boolean;
    idempotency: {
        key: string;
        wasDuplicate: boolean;
        ttlMin: number;
    };
    breaker: {
        windowSec: number;
        maxPerWindow: number;
        countInWindow: number;
        tripped: boolean;
    };
    order?: {
        provider: "binance-testnet" | "simulated";
        id?: string;
        symbol?: string;
        qty?: number;
        side?: "BUY" | "SELL";
        status?: string;
        ts?: string;
    };
    evidence: {
        root: string;
        live_apply: string;
    };
};
export declare const CANARY_THRESHOLDS: {
    readonly ack_p95_ms: 1000;
    readonly event_to_db_p95_ms: 300;
    readonly ingest_lag_p95_s: 2;
    readonly seq_gap_total: 0;
    readonly slippage_p95_bps: 25;
    readonly clock_drift_ms_p95: 500;
};
export type CanaryThresholds = typeof CANARY_THRESHOLDS;
export declare function normalizeThresholds(partial?: Partial<CanaryThresholds>): CanaryThresholds;
//# sourceMappingURL=canary.d.ts.map