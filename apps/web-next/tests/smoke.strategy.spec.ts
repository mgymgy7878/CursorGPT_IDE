import { test, expect } from "@playwright/test"

test('@smoke strategy generate/backtest/optimize', async ({ request }) => {
	let r = await request.post('http://127.0.0.1:3003/api/strategy/generate', {
		data: { symbol:'BTCUSDT', exchange:'BINANCE', tf:'1h' }
	})
	expect(r.ok()).toBeTruthy()

	r = await request.post('http://127.0.0.1:3003/api/strategy/backtest', {
		data: { strategyName:'TrendFollower', params:{fast:20, slow:100}, candles: [] }
	})
	expect(r.ok()).toBeTruthy()

	r = await request.post('http://127.0.0.1:3003/api/strategy/optimize', {
		data: { strategyName:'TrendFollower', space:{ fast:[10,20], slow:[100,120] } }
	})
	expect(r.ok()).toBeTruthy()
}) 
