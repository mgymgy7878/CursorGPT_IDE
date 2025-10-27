export type Regime = 'UP_TREND' | 'DOWN_TREND' | 'MEAN' | 'SIDE' | 'VOL'

function ema(values: number[], n: number) {
	let k = 2 / (n + 1)
	let ema = values[0] || 0
	for (let i = 1; i < values.length; i++) ema = values[i]! * k + ema * (1 - k)
	return ema
}

export function detectRegime(prices: number[]): Regime {
	if (prices.length < 50) return 'SIDE'
	const rets = prices.slice(1).map((p, i) => Math.log(p / prices[i]!))
	const vol = Math.sqrt(252) * Math.sqrt(rets.reduce((a, b) => a + b * b, 0) / rets.length)
	const ma20 = ema(prices.slice(-20), 20)
	const ma200 = ema(prices.slice(-200), 200)
	const slope = ma20 - ma200
	// Yaklaşık Hurst (R/S basitleştirme)
	const mean = rets.reduce((a, b) => a + b, 0) / rets.length
	const cum = rets.map((r, i) => rets.slice(0, i + 1).reduce((a, b) => a + (b - mean), 0))
	const R = Math.max(...cum) - Math.min(...cum)
	const S = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length) || 1
	const hurst = Math.log((R / S) || 1) / Math.log(rets.length || 2)

	if (vol > 0.8) return 'VOL'
	if (Math.abs(slope) < 0.0005) return 'MEAN'
	if (slope > 0.0005 && hurst > 0.5) return 'UP_TREND'
	if (slope < -0.0005 && hurst > 0.5) return 'DOWN_TREND'
	return 'SIDE'
}

export function chooseStrategy(r: Regime) {
	if (r === 'UP_TREND' || r === 'DOWN_TREND') return 'TrendFollower'
	if (r === 'MEAN' || r === 'SIDE' || r === 'VOL') return 'GridBot'
	return 'TrendFollower'
} 