import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { envBool, envNum } from "@/lib/env"

let liveBlocked = 0
// export { liveBlocked as spark_live_blocked_total }

const buckets = new Map<string, TokenBucket>()
function getBucket(key: string, capacityPerSec: number) {
	let b = buckets.get(key)
	if (!b) { b = new TokenBucket(capacityPerSec, capacityPerSec); buckets.set(key, b) }
	return b
}

function capCheck({ notionalUSD, live }: { notionalUSD: number; live: boolean }) {
	const LIVE_ENABLED = envBool('LIVE_ENABLED', false)
	const CAP_USD = envNum('LIVE_ORDER_CAP_USD', 50)
	if (live && (!LIVE_ENABLED || notionalUSD > CAP_USD)) {
		liveBlocked++
		return { ok: false, code: 403, reason: 'LIVE_CAP' as const }
	}
	return { ok: true, code: 200 as const }
}

export async function POST(req: Request, { params }: { params: { exchange: string } }) {
	try { requireRole(new Headers(req.headers)) } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
	const key = (req.headers as any).get?.('idempotency-key') || `post-${params.exchange}-${Date.now()}`
	const body = await req.json().catch(()=> ({}))
	const notionalUSD = Number(body?.qty || 0) * Number(body?.price || 0)
	const gate = capCheck({ notionalUSD, live: !!body?.live })
	if (!gate.ok) return NextResponse.json({ ok: false, error: gate.reason }, { status: gate.code })
	const exec = async () => {
		// TODO: gerçek adapter ile emir gönder
		return { orderId: 'dev-paper' }
	}
	const res = await exec()
	return NextResponse.json({ ok: true, exchange: params.exchange, ...res, echo: body })
}

export async function DELETE(req: Request, { params }: { params: { exchange: string } }) {
	try { requireRole(new Headers(req.headers)) } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
	const key = (req.headers as any).get?.('idempotency-key') || `delete-${params.exchange}-${Date.now()}`
	const body = await req.json().catch(()=> ({}))
	const exec = async () => {
		// TODO: close/cancel
		return { closed: body?.symbol || true }
	}
	const res = await exec()
	return NextResponse.json({ ok: true, exchange: params.exchange, ...res })
} 