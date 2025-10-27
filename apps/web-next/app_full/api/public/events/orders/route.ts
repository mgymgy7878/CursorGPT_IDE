import { NextRequest } from "next/server"

const EXEC = process.env.EXEC_ORIGIN ?? 'http://127.0.0.1:4001'

export async function GET(_req: NextRequest) {
  const execRes = await fetch(`${EXEC}/events/orders`, {
    headers: { Accept: 'text/event-stream' },
    cache: 'no-store'
  })
  const readable = execRes.body!
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
} 