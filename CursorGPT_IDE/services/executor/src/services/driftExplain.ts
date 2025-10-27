export type DriftExplain = {
	tldr: string;
	window: string;
	lag: { p50_ms: number; p95_ms: number };
	features: Array<{ name: string; weight: number; direction: 'up'|'down' }>;
	risk_hints: string[];
};

export async function getDriftExplain(params: { symbol: string; window: string }): Promise<DriftExplain> {
	const { symbol, window } = params;
	return {
		tldr: `Drift ${symbol} için ${window} penceresinde orta düzey.`,
		window,
		lag: { p50_ms: 420, p95_ms: 1350 },
		features: [
			{ name: 'spread_z', weight: 0.41, direction: 'up' },
			{ name: 'volume_delta', weight: 0.27, direction: 'up' },
			{ name: 'rsi_14', weight: 0.18, direction: 'down' }
		],
		risk_hints: ['Freshness p95 < 2s olmalı', 'Event→DB p95 < 300ms eşiklerini izle']
	};
} 