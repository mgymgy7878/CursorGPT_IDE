import { NextResponse } from "next/server"
import { detectRegime, chooseStrategy } from "@spark/agents"

export async function GET(req: Request) {
	const url = new URL(req.url)
	const symbol = url.searchParams.get('symbol') || 'BTCUSDT'
	const tf = url.searchParams.get('tf') || '1h'
	// Fixture fiyatlar
	const prices = Array.from({ length: 500 }, (_, i) => 100 + Math.sin(i / 20) * 2 + Math.random() * 0.3)
	const regime = detectRegime(prices)
	const strat = chooseStrategy(regime)
	const daily = { pnl: 0.4, trades: 12 }
	const weekly = { pnl: 2.1, trades: 57 }
	const monthly = { pnl: 6.8, trades: 220 }
	const bias = strat === 'TrendFollower' ? 'UP' : 'MEAN'
	return NextResponse.json({ ok: true, symbol, tf, regime, strategy: strat, daily, weekly, monthly, bias })
} 
