export declare const version = "0.0.1";
export declare const sleep: (ms: number) => Promise<void>;
export declare const env: (key: string, fallback?: string) => string;
export declare const isProd: boolean;
export declare function assert(condition: any, msg: string): asserts condition;
export * from './env.js';
export * from './events.js';
export * from './fs-json.js';
export * from './guards.js';
export * from './logger.js';
export * from './path-safe.js';
export * from './schemas.js';
export * from './types.js';
export * from './normalize/backtest.js';
//# sourceMappingURL=index.d.ts.map