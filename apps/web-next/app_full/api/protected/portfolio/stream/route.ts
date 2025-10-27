// moved from pages/api/portfolio/stream.ts to app/api/protected/portfolio/stream/route.ts
import type { NextRequest } from "next/server"
import { portfolioHub } from "../../../../../server/portfolioHub"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = false

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      const write = (data: unknown) => {
        const chunk = `data: ${JSON.stringify({ ts: Date.now(), snapshot: data })}\n\n`
        controller.enqueue(encoder.encode(chunk))
      }
      const unsubscribe = portfolioHub.subscribe(write)
      // @ts-ignore attach cancel
      ;(controller as any)._cleanup = unsubscribe
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
