import type { NextRequest } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest) {
	let closed = false
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const enc = new TextEncoder()
			const send = () => {
				if (closed) return
				try {
					const msg = { ts: Date.now(), level: 'info', message: 'heartbeat' }
					controller.enqueue(enc.encode(`data: ${JSON.stringify(msg)}\n\n`))
				} catch {}
			}
			const id = setInterval(send, 1000)
			send()
			;(controller as any)._cleanup = () => clearInterval(id)
		},
		cancel() {
			closed = true
			try { ((this as any)._cleanup as (()=>void)|undefined)?.() } catch {}
		}
	})
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	})
} 
