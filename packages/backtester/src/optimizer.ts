import type { BacktestResult } from "@spark/shared"

export type ParamSpace = Record<string, number[]>
export type ScoreWeights = { wPnL?: number; wSharpe?: number; wMaxDD?: number; wPF?: number }

export let lastPF = 0
export let lastScore = 0

function computePF(res: BacktestResult) {
	// Basit taklit: equity serisinden kazanç/kayıp ayrıştırılamadığı için proxy
	// Gerçek ortamda trades üzerinden grossProfit/grossLoss hesaplanmalı
	const gp = Math.max(1, res.totalTrades * 2)
	const gl = Math.max(1, Math.floor(res.totalTrades * (1 - res.winRate)))
	return gp / Math.max(1, gl)
}

function computeScore(res: BacktestResult, weights: ScoreWeights = {}) {
	const { totalReturn, sharpeRatio, maxDrawdown } = res
	const w = { wPnL: 1, wSharpe: 1, wMaxDD: 1, wPF: 1, ...weights }
	const pf = computePF(res)
	lastPF = pf
	const score = w.wPnL * totalReturn + w.wSharpe * sharpeRatio - w.wMaxDD * maxDrawdown + w.wPF * pf
	lastScore = score
	return score
}

export async function optimizeGrid(
	evaluate: (params: Record<string, number>) => Promise<BacktestResult>,
	space: ParamSpace,
	weights: ScoreWeights = {}
) {
	let best = { score: -Infinity, params: {} as Record<string, number>, result: null as null | BacktestResult }
	const keys = Object.keys(space)
	async function dfs(i: number, acc: Record<string, number>) {
		if (i === keys.length) {
			const res = await evaluate(acc)
			const score = computeScore(res, weights)
			if (score > best.score) best = { score, params: { ...acc }, result: res }
			return
		}
		const k = keys[i]
		if (k) {
			const values = space[k]
			if (values && values.length > 0) {
				for (const v of values) {
					acc[k] = v
					await dfs(i + 1, acc)
				}
			}
		}
	}
	await dfs(0, {})
	return best
}

export async function optimizeBayes(
	evaluate: (params: Record<string, number>) => Promise<BacktestResult>,
	space: ParamSpace,
	weights: ScoreWeights = {},
	iters = 20
) {
	let best = { score: -Infinity, params: {} as Record<string, number>, result: null as null | BacktestResult }
	const keys = Object.keys(space)
	for (let i = 0; i < iters; i++) {
		const cand: Record<string, number> = {}
		for (const k of keys) {
			if (k) {
				const arr = space[k]
				if (arr && arr.length > 0) {
					const randomIndex = Math.floor(Math.random() * arr.length)
					cand[k] = arr[randomIndex] || 0
				}
			}
		}
		const res = await evaluate(cand)
		const score = computeScore(res, weights)
		if (score > best.score) best = { score, params: cand, result: res }
	}
	return best
}

export function walkForwardSplits(len: number, folds = 3) {
	const seg = Math.floor(len / (folds + 1))
	const ranges: Array<{ train: [number, number]; test: [number, number] }> = []
	for (let i = 0; i < folds; i++) {
		const trainEnd = seg * (i + 1)
		ranges.push({ train: [0, trainEnd], test: [trainEnd, trainEnd + seg] })
	}
	return ranges
}

export function overfitScore(inSample: number, outSample: number): number {
	if (inSample <= 0) return 1
	return Math.max(0, 1 - outSample / inSample)
} 
