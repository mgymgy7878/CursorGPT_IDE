import { z } from "zod";
export const PolicySchema = z.object({
    maxNotional: z.number().positive().default(1000),
    maxDrawdown: z.number().min(0).max(1).default(0.1),
    allowedSymbols: z.array(z.string()).default(['BTCUSDT', 'ETHUSDT']),
    allowLive: z.boolean().default(false),
    // Optional fields to support guardrails middleware
    killSwitch: z.boolean().optional(),
    perAsset: z.record(z.object({ maxNotional: z.number().optional() })).optional(),
    maxOpenPositions: z.number().int().optional(),
    maxDailyLoss: z.number().optional(),
    canaryPct: z.number().min(0).max(100).optional()
});
export function evaluate(policy, act) {
    const reasons = [];
    if (!policy.allowedSymbols.includes(act.symbol))
        reasons.push('SYMBOL_NOT_ALLOWED');
    if (act.notional > policy.maxNotional)
        reasons.push('NOTIONAL_EXCEEDS_LIMIT');
    if (act.live && !policy.allowLive)
        reasons.push('LIVE_NOT_ALLOWED');
    return { allow: reasons.length === 0, reasons, policy };
}
export const defaultPolicy = PolicySchema.parse({});
export function evaluatePolicy(_) {
    return { allowed: true }; // stub
}
// İstenen isimle alias export:
export const policyCheck = evaluatePolicy;
//# sourceMappingURL=policy.js.map