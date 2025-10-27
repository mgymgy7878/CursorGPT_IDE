import { z } from "zod";
export declare const PolicySchema: z.ZodObject<{
    maxNotional: z.ZodDefault<z.ZodNumber>;
    maxDrawdown: z.ZodDefault<z.ZodNumber>;
    allowedSymbols: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allowLive: z.ZodDefault<z.ZodBoolean>;
    killSwitch: z.ZodOptional<z.ZodBoolean>;
    perAsset: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        maxNotional: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxNotional?: number | undefined;
    }, {
        maxNotional?: number | undefined;
    }>>>;
    maxOpenPositions: z.ZodOptional<z.ZodNumber>;
    maxDailyLoss: z.ZodOptional<z.ZodNumber>;
    canaryPct: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxDrawdown: number;
    maxNotional: number;
    allowedSymbols: string[];
    allowLive: boolean;
    killSwitch?: boolean | undefined;
    perAsset?: Record<string, {
        maxNotional?: number | undefined;
    }> | undefined;
    maxOpenPositions?: number | undefined;
    maxDailyLoss?: number | undefined;
    canaryPct?: number | undefined;
}, {
    maxDrawdown?: number | undefined;
    maxNotional?: number | undefined;
    killSwitch?: boolean | undefined;
    allowedSymbols?: string[] | undefined;
    allowLive?: boolean | undefined;
    perAsset?: Record<string, {
        maxNotional?: number | undefined;
    }> | undefined;
    maxOpenPositions?: number | undefined;
    maxDailyLoss?: number | undefined;
    canaryPct?: number | undefined;
}>;
export type Policy = z.infer<typeof PolicySchema>;
export type Action = {
    type: 'ORDER';
    symbol: string;
    side: 'BUY' | 'SELL';
    qty: number;
    price?: number;
    notional: number;
    live: boolean;
};
export type Decision = {
    allow: boolean;
    reasons: string[];
    policy: Policy;
};
export declare function evaluate(policy: Policy, act: Action): Decision;
export type GuardrailPolicy = Policy;
export type Order = {
    asset: string;
    notional: number;
};
export type GuardrailResult = {
    allowed: boolean;
    reason?: string;
    details?: Record<string, unknown>;
};
export declare const defaultPolicy: GuardrailPolicy;
export type Level = "warn" | "block";
export interface PolicyRule {
    id: string;
    enabled: boolean;
    level: Level;
}
export interface PolicyDecision {
    allowed: boolean;
    reasons?: string[];
}
export declare function evaluatePolicy(_: unknown): PolicyDecision;
export declare const policyCheck: typeof evaluatePolicy;
//# sourceMappingURL=policy.d.ts.map