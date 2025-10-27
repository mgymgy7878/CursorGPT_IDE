import { NextResponse } from "next/server"

export const revalidate = false

const EXEC = process.env.EXEC_ORIGIN ?? 'http://127.0.0.1:4001'

async function fetchJson(url: string, timeoutMs = 1500) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { cache: 'no-store', signal: ctl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally { clearTimeout(t) }
}

export async function GET() {
  const headers = new Headers({ 'Cache-Control': 'no-store' })

  // 1) Executor'dan dene
  try {
    const data = await fetchJson(`${EXEC}/portfolio/summary`, 1500)
    return NextResponse.json({ ok: true, source: 'executor', data }, { headers })
  } catch {}

  // 2) Evidence fallback
  const data = { 
    totalNotional: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    bySymbol: [],
    risk: { exposurePct: 0, leverageEst: 0, positions: 0 },
    ts: new Date().toISOString()
  }
  return NextResponse.json({ ok: true, source: 'evidence', data }, { headers })
} 