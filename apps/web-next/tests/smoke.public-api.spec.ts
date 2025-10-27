import { test, expect } from "@playwright/test"

test('@smoke public health', async ({ request }) => {
	const r = await request.get('http://127.0.0.1:3003/api/public/health')
	expect(r.ok()).toBeTruthy()
})

test('@smoke public metrics', async ({ request }) => {
	const r = await request.get('http://127.0.0.1:3003/api/public/metrics/prom')
	expect(r.status()).toBe(200)
	const text = await r.text()
	expect(text).toContain('spark_')
}) 
