import { aiToolCallsTotal } from "../metrics/ai";

const BASE = process.env.EXECUTOR_BASE_INTERNAL || 'http://127.0.0.1:4001';

export async function getStatusSummary(): Promise<string> {
	let health = 'UNKNOWN', ackP95='-', evtDbP95='-', freshness='-', drift='-', openOrders='-';
	try {
		aiToolCallsTotal.labels('get_status' as any).inc();
		const r = await fetch(`${BASE.replace(/\/+$/,'')}/tools/get_status`, { method: 'POST' });
		const j = await r.json();
		health = j.health ?? 'UNKNOWN';
		ackP95 = j.metrics?.ack_p95_ms?.toString() ?? '-';
		evtDbP95 = j.metrics?.event_to_db_p95_ms?.toString() ?? '-';
		freshness = j.freshness?.lag_p95_s?.toString() ?? '-';
		drift = j.drift?.score_p95?.toString() ?? '-';
		openOrders = Array.isArray(j.open_orders) ? String(j.open_orders.length) : (j.open_orders_count?.toString() ?? '-');
	} catch {}
	return [
		'TL;DR — sistem özeti',
		`HEALTH: ${health}`,
		`p95 — ack: ${ackP95} ms, event→db: ${evtDbP95} ms`,
		`Freshness lag p95: ${freshness} s, Drift p95: ${drift}`,
		`Open orders: ${openOrders}`,
		'Kanıt: /metrics, /canary/stats, audit logs'
	].join('\n');
} 