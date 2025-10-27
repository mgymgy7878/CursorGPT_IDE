export async function getDriftFreshness(): Promise<string> {
	const base = process.env.EXECUTOR_BASE_INTERNAL || 'http://127.0.0.1:4001';
	const r = await fetch(`${base.replace(/\/+$/,'')}/tools/get_status`, { method: 'POST' });
	const j = await r.json().catch(()=>({}));
	const drift = j.drift?.score_p95 ?? '-';
	const lag   = j.freshness?.lag_p95_s ?? '-';
	const win   = j.freshness?.window_s ?? '-';
	return [
		'TL;DR — veri istikrarı',
		`Drift p95: ${drift}`,
		`Freshness lag p95: ${lag} s (window: ${win}s)`,
		'Kanıt: /metrics ingest_lag, /canary/stats'
	].join('\n');
} 