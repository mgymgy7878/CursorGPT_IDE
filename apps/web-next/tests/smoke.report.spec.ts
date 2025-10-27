import { test, expect } from "@playwright/test"

test('@smoke-report report ok', async ({ request }) => {
  const r = await request.get('http://127.0.0.1:3003/api/report')
  expect(r.ok()).toBeTruthy()
  const j = await r.json()
  expect(typeof j.bias).toBe('string')
}) 
