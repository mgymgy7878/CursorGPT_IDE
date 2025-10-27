export const version = '0.0.1';
export const sleep = (ms) => new Promise(res => setTimeout(res, ms));
export const env = (key, fallback) => (process.env[key] ?? fallback ?? '');
export const isProd = process.env.NODE_ENV === 'production';
export function assert(condition, msg) {
    if (!condition)
        throw new Error(msg);
}
// Barrel exports
export * from './env.js';
export * from './events.js';
export * from './fs-json.js';
export * from './guards.js';
export * from './logger.js';
export * from './path-safe.js';
export * from './schemas.js';
export * from './types.js';
export * from './normalize/backtest.js';
// Auto-generated barrel exports (removed broken absolute re-exports)
