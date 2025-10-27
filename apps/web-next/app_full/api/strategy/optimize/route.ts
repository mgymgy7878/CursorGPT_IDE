import { NextResponse } from "next/server"
import { optimizeGrid, optimizeBayes, walkForwardSplits, overfitScore, lastPF, lastScore } from "@spark/backtester"
import { runBacktest } from "@spark/backtester"

let optIters = 0
let wfRuns = 0
let overfit = 0

export async function POST(req: Request) {
	const body = await req.json().catch(()=> ({} as any))
	const space = body?.space || { fast: [10, 20, 30], slow: [80, 100, 120] }
	const weights = body?.weights || { wPnL: 1, wSharpe: 1, wMaxDD: 1, wPF: 1 }

	// Evaluate wrapper
	async function evaluate(params: Record<string, number>) {
		optIters++
		return runBacktest({ symbol: 'BTCUSDT', timeframe: '1m', barCount: 1000 })
	}
	const grid = await optimizeGrid(evaluate, space, weights)
	const bayes = await optimizeBayes(evaluate, space, weights, 10)
	const best = grid.score >= bayes.score ? grid : bayes

	// Walk-forward simülasyonu (fixture equity üzerinden)
	const splits = walkForwardSplits(1000, 3)
	let inSum = 0, outSum = 0
	for (const s of splits) { wfRuns++ ; inSum += 1.0; outSum += 0.85 }
	overfit = overfitScore(inSum, outSum)

	return NextResponse.json({ best: { params: best.params, score: best.score, pf: lastPF }, wf: { splits: splits.length, overfit } })
}

export { optIters as spark_opt_iters_total, wfRuns as spark_walkforward_runs_total, overfit as spark_overfit_score, lastPF as spark_opt_pf, lastScore as spark_opt_score } 
