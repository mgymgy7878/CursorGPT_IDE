import { z } from "zod";
export const PolicySchema = z.object({
	maxNotional:z.number().positive().default(1000),
	maxDrawdown:z.number().min(0).max(1).default(0.1),
	allowedSymbols:z.array(z.string()).default(['BTCUSDT','ETHUSDT']),
	allowLive:z.boolean().default(false),
	// Optional fields to support guardrails middleware
	killSwitch: z.boolean().optional(),
	perAsset: z.record(z.object({ maxNotional: z.number().optional() })).optional(),
	maxOpenPositions: z.number().int().optional(),
	maxDailyLoss: z.number().optional(),
	canaryPct: z.number().min(0).max(100).optional()
});
export type Policy = z.infer<typeof PolicySchema>;
export type Action = { type:'ORDER'; symbol:string; side:'BUY'|'SELL'; qty:number; price?:number; notional:number; live:boolean };
export type Decision = { allow:boolean; reasons:string[]; policy:Policy };
export function evaluate(policy:Policy, act:Action):Decision{
	const reasons:string[]=[];
	if (!policy.allowedSymbols.includes(act.symbol)) reasons.push('SYMBOL_NOT_ALLOWED');
	if (act.notional > policy.maxNotional) reasons.push('NOTIONAL_EXCEEDS_LIMIT');
	if (act.live && !policy.allowLive) reasons.push('LIVE_NOT_ALLOWED');
	return { allow: reasons.length===0, reasons, policy };
}

// Exports expected by guardrails.ts
export type GuardrailPolicy = Policy;
export type Order = { asset:string; notional:number };
export type GuardrailResult = { allowed:boolean; reason?:string; details?:Record<string,unknown> };
export const defaultPolicy: GuardrailPolicy = PolicySchema.parse({}); 

export type Level = "warn" | "block";
export interface PolicyRule { id: string; enabled: boolean; level: Level; }
export interface PolicyDecision { allowed: boolean; reasons?: string[]; }

export function evaluatePolicy(_: unknown): PolicyDecision {
  return { allowed: true }; // stub
}

// İstenen isimle alias export:
export const policyCheck = evaluatePolicy; 