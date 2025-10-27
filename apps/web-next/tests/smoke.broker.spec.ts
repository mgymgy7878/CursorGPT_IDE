import { test, expect } from "@playwright/test"
const base = 'http://127.0.0.1:3003'

test('@smoke broker unauthorized', async ({ request }) => {
  const r = await request.get(`${base}/api/broker/binance/balance`)
  expect([401,403]).toContain(r.status())
})

test('@smoke broker dev-auth', async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'x-dev-role': 'admin' } })
  const page = await ctx.newPage()
  const b = await ctx.request.get(`${base}/api/broker/binance/balance`);  expect(b.ok()).toBeTruthy()
  const p = await ctx.request.get(`${base}/api/broker/binance/positions`); expect(p.ok()).toBeTruthy()
  const o = await ctx.request.post(`${base}/api/broker/binance/order`, { data: { symbol:'BTCUSDT', side:'BUY', qty:0.01, type:'MARKET' } })
  expect(o.ok()).toBeTruthy()
  await ctx.close()
}) 
