import { aiToolCallsTotal } from "../metrics/ai.js";

const BASE = process.env.EXECUTOR_BASE_INTERNAL || 'http://127.0.0.1:4001';

export async function getFreshnessSummary(): Promise<string> {
	aiToolCallsTotal.labels('freshness_status' as any).inc();
	const r = await fetch(`${BASE.replace(/\/+$/,'')}/tools/get_status`, { method:'POST' });
	const j = await r.json().catch(()=>({}));
	const lagP50 = j.freshness?.lag_p50_s ?? '-';
	const lagP95 = j.freshness?.lag_p95_s ?? '-';
	const lagMin = j.freshness?.lag_min_s ?? '-';
	const lagMax = j.freshness?.lag_max_s ?? '-';
	const win    = j.freshness?.window_s ?? '-';
	const src    = j.freshness?.source ?? '/tools/get_status';
	return [
		'TL;DR — freshness özeti',
		`Lag p50: ${lagP50} s, p95: ${lagP95} s`,
		`Lag min/max: ${lagMin} s / ${lagMax} s`,
		`Window: ${win} s`,
		`Kanıt: ${src}`
	].join('\n');
} 