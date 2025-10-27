import { test, expect, request as req } from "@playwright/test"

test('@smoke sse unauthorized 401', async ({ request }) => {
	const r = await request.get('http://127.0.0.1:3003/api/logs/sse')
	expect(r.status()).toBe(401)
})

test('@smoke sse dev-auth 200', async () => {
	const ctx = await req.newContext({ extraHTTPHeaders: { 'x-dev-role': 'admin' } })
	const r = await ctx.get('http://127.0.0.1:3003/api/logs/sse')
	expect(r.status()).toBe(200)
	await ctx.dispose()
}) 
