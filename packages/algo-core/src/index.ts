export type PriceBar = { time: number; open: number; high: number; low: number; close: number; volume?: number };

export function rsi(values: number[], period = 14): number[] {
	if (values.length === 0) return [];
	const res: number[] = new Array(values.length).fill(NaN);
	let gains = 0, losses = 0;
	for (let i = 1; i < values.length; i++) {
		const ch = values[i]! - values[i - 1]!;
		gains += Math.max(0, ch);
		losses += Math.max(0, -ch);
		if (i >= period) {
			const avgGain = gains / period;
			const avgLoss = losses / period;
			const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
			res[i] = 100 - 100 / (1 + rs);
			const chOld = values[i - period + 1]! - values[i - period]!;
			gains -= Math.max(0, chOld);
			losses -= Math.max(0, -chOld);
		}
	}
	return res;
}

export type Signal = 'long' | 'short' | 'flat';

export function rsiCrossStrategy(prices: PriceBar[], { overbought = 70, oversold = 30, period = 14 } = {}): Signal[] {
	const closes = prices.map(p => p.close);
	const rsis = rsi(closes, period);
	const out: Signal[] = new Array(prices.length).fill('flat');
	let prev: Signal = 'flat';
	for (let i = 1; i < prices.length; i++) {
		const v = rsis[i];
		if (!Number.isFinite(v) || v === undefined || v === null) { 
			out[i] = prev; 
			continue; 
		}
		if (v < oversold && prev !== 'long') prev = 'long';
		else if (v > overbought && prev !== 'short') prev = 'short';
		out[i] = prev;
	}
	return out;
} 