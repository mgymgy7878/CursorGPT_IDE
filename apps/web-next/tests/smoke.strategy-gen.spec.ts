import { test, expect } from "@playwright/test"

test('@smoke-strategy-gen generate returns dsl+ts', async ({ request }) => {
  const r = await request.post('http://127.0.0.1:3003/api/strategy/generate', { data: {} })
  expect(r.ok()).toBeTruthy()
  const j = await r.json()
  expect(typeof j.dsl).toBe('string')
  expect(typeof j.ts).toBe('string')
}) 
