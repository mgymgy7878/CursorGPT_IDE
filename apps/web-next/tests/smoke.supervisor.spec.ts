import { test, expect } from "@playwright/test"
const base = 'http://127.0.0.1:3003'

test('@smoke supervisor dev-auth', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'x-dev-role': 'admin' } })
  const start = await ctx.request.post(`${base}/api/supervisor/start`, { data: { symbol:'BTCUSDT', exchange:'BINANCE', tf:'1h', mode:'paper' } })
  expect(start.ok()).toBeTruthy()
  const stop = await ctx.request.post(`${base}/api/supervisor/stop`, { data: { symbol:'BTCUSDT', exchange:'BINANCE' } })
  expect(stop.ok()).toBeTruthy()
  await ctx.close()
}) 
