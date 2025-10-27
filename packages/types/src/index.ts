// Build-safety minimal tek barrel
export type Health = { ok: boolean; ts: number };
export type CanaryState = 'IDLE' | 'ARMED' | 'TRADING';
export type ApiResponse<T = unknown> = { success: boolean; data?: T; error?: string };

// Market types
export * from './market.js';

// Event Bus ve Guard exports
export * from './events.js';
export * from './guards.js';

// Auto-generated barrel exports
export * from './adapters/bar.js';
export * from './canary.js';
export * from './ohlc.js';
export * from './trading/canary.js';
export * from './trading/events.js';
export * from './trading/requests.js';
export * from './trading/thresholds.js';


// Auto-generated barrel exports (dupe cleaned)
