import { test, expect } from "@playwright/test"

test('@smoke-optimize optimize returns best params', async ({ request }) => {
  const r = await request.post('http://127.0.0.1:3003/api/strategy/optimize', {
    data: { space: { fast: [10, 20], slow: [80, 100] } }
  })
  expect(r.ok()).toBeTruthy()
  const j = await r.json()
  expect(j?.best?.params).toBeTruthy()
}) 
