export type DriftCompareOut = {
	tldr: string;
	symbol: string;
	baseline: string;
	window: string;
	lag: { baseline_p95_ms: number; current_p95_ms: number; delta_ms: number; sign: 'up'|'down'|'flat' };
	features_delta: Array<{ name: string; delta_weight: number; direction: 'up'|'down'|'flat' }>;
	notes: string[];
};

export async function getDriftCompare(params: { symbol: string; baseline: string; window: string }): Promise<DriftCompareOut> {
	const { symbol, baseline, window } = params;
	const baseline_p95 = 1100, current_p95 = 1350;
	const delta = current_p95 - baseline_p95;
	return {
		tldr: `Drift ${symbol}: p95 ${delta>=0?'+':""}${delta}ms (${baseline} → now), window=${window}`,
		symbol, baseline, window,
		lag: { baseline_p95_ms: baseline_p95, current_p95_ms: current_p95, delta_ms: delta, sign: delta>50?'up':delta<-50?'down':'flat' },
		features_delta: [
			{ name: 'spread_z', delta_weight: +0.08, direction: 'up' },
			{ name: 'volume_delta', delta_weight: +0.03, direction: 'up' },
			{ name: 'rsi_14', delta_weight: -0.02, direction: 'down' }
		],
		notes: ['Ack p95 hedef ≤1000ms', 'Evt→DB p95 hedef ≤300ms', 'Freshness p95 hedef ≤2s']
	};
} 