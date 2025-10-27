export declare const sleep: (ms: number) => Promise<void>;
export declare const envStr: (k: string, def?: string) => string;
export declare const envBool: (k: string, def?: boolean) => boolean;
export declare const envNum: (k: string, def?: number) => number;
export declare const headerStr: (headers: Record<string, string | string[]>, key: string) => string;
export declare function readJSONFile<T = unknown>(p: string): Promise<T>;
export declare function writeJSONFile(p: string, data: unknown): Promise<void>;
export declare function assertFiniteNumber(x: unknown, name?: string): number;
export declare function safeStat(path: string): {
    exists: boolean;
    size?: number;
};
export declare function ensureWithin(value: number, min: number, max: number): number;
export declare function isRecord(x: unknown): x is Record<string, unknown>;
export declare function assertNever(x: never): never;
export type Json = unknown;
export declare class TokenBucket {
    capacity: number;
    tokens: number;
    refillRate: number;
    lastRefill: number;
    constructor(capacity?: number, refillRate?: number);
    private refill;
    allow(count?: number): boolean;
    take(count?: number): number;
}
export type Role = "admin" | "trader" | "viewer";
//# sourceMappingURL=index.d.ts.map