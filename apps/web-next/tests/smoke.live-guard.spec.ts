import { test, expect, request as req } from "@playwright/test"

test('@smoke-live-guard live cap blocks large order', async () => {
  const ctx = await req.newContext({ extraHTTPHeaders: { 'x-dev-role': 'admin' } })
  const r = await ctx.post('http://127.0.0.1:3003/api/broker/binance/order', {
    data: { side:'BUY', qty: 10, price: 100, live: true }
  })
  expect([403,429]).toContain(r.status())
})

test('@smoke-live-guard live small passes', async () => {
  const ctx = await req.newContext({ extraHTTPHeaders: { 'x-dev-role': 'admin' } })
  const r = await ctx.post('http://127.0.0.1:3003/api/broker/binance/order', {
    data: { side:'BUY', qty: 0.1, price: 100, live: true }
  })
  expect(r.status()).toBe(200)
}) 
