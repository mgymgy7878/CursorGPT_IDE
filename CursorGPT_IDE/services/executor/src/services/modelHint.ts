export type ModelHintOut = {
	tldr: string;
	symbol?: string;
	timeframe?: string;
	recommend: { id: string; provider: 'openai'|'anthropic'; class: 'fast'|'quality'; reason: string };
	alternatives: Array<{ id: string; class: 'fast'|'quality'; reason: string }>;
	est_cost_usd?: number;
};

export async function getModelHint(params: { symbol?: string; timeframe?: string; max_latency_ms?: number; cost_tier?: 'low'|'mid'|'high' }): Promise<ModelHintOut> {
	const { symbol="BTCUSDT", timeframe="4h", max_latency_ms=1200, cost_tier="mid" } = params;
	let rec = { id: 'openai:gpt-4o-mini', provider: 'openai' as const, class: 'fast' as const, reason: 'low cost & fast' };
	if (max_latency_ms > 1200 || cost_tier==='high') rec = { id: 'anthropic:claude-3-5-sonnet', provider: 'anthropic', class: 'quality', reason: 'higher reasoning depth' } as any;
	return {
		tldr: `Öneri: ${rec.id} (${rec.class}) — ${rec.reason}`,
		symbol, timeframe, recommend: rec,
		alternatives: [
			{ id: 'openai:gpt-4o-mini', class: 'fast', reason: 'düşük maliyet' },
			{ id: 'anthropic:claude-3-5-sonnet', class: 'quality', reason: 'uzun bağlam' }
		],
		est_cost_usd: rec.class==='fast' ? 0.001 : 0.005
	};
} 