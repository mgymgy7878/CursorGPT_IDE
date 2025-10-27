import { NextResponse } from "next/server"

function isDevAuth(req: Request) {
	if (process.env.NODE_ENV !== 'production') {
		const hdr = (req.headers as any).get?.('x-dev-role')
		const url = new URL(req.url)
		const token = url.searchParams.get('token')
		if (hdr === 'admin' || (token && token === process.env.DEV_TOKEN)) return true
	}
	return false
}

let clients = 0
let messages = 0

export async function GET(req: Request) {
	if (!(isDevAuth(req))) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const stream = new ReadableStream({
		start(controller) {
			const enc = new TextEncoder()
			const send = (type: string, data: any) => {
				messages++
				controller.enqueue(enc.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`))
			}
			clients++
			send('hello', { ts: Date.now(), clients })
			const t = setInterval(() => send('ping', { ts: Date.now() }), 10000)
			// @ts-ignore
			controller._t = t
		},
		cancel() {
			// @ts-ignore
			clearInterval(this._t)
			clients = Math.max(0, clients - 1)
		}
	})

	return new NextResponse(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive'
		}
	})
}

// export for metrics
export { clients, messages } 
