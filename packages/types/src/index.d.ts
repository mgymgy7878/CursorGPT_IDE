export type Health = {
    ok: boolean;
    ts: number;
};
export type CanaryState = 'IDLE' | 'ARMED' | 'TRADING';
export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};
export * from './market.js';
export * from './events.js';
export * from './guards.js';
export * from './adapters/bar.js';
export * from './canary.js';
export * from './ohlc.js';
export * from './trading/canary.js';
export * from './trading/events.js';
export * from './trading/requests.js';
export * from './trading/thresholds.js';
