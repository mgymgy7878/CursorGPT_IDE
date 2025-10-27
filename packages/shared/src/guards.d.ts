export declare function isRecord(x: unknown): x is Record<string, unknown>;
export declare function hasKey<T extends Record<string, unknown>, K extends string>(obj: T, key: K): obj is T & Record<K, unknown>;
export declare function isNonEmptyString(x: unknown): x is string;
export declare function toStrOrNull(x: unknown): string | null;
export declare function toNumOrNull(x: unknown): number | null;
export declare function assert(cond: any, msg?: string): asserts cond;
export declare function assertNonEmptyString(x: unknown, name: string): string;
export declare function assertFiniteNumber(x: unknown, name: string): number;
//# sourceMappingURL=guards.d.ts.map