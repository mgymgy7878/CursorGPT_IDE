// moved from pages/api/metrics/stream.ts to app/api/protected/metrics/stream/route.ts
import type { NextRequest } from "next/server"
import { getMetricsSnapshot } from "../../../../../server/portfolioHub"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = false

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder()
      const send = () => controller.enqueue(enc.encode(`data: ${JSON.stringify({ ts: Date.now(), metrics: getMetricsSnapshot() })}\n\n`))
      const id = setInterval(send, 1000)
      send()
      // @ts-ignore attach cleanup
      ;(controller as any)._cleanup = () => clearInterval(id)
    },
    cancel() {
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
