import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { envBool, envNum } from "@/lib/env"

export async function POST(req: Request) {
  try { requireRole(new Headers(req.headers)) } catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  const body = await req.json().catch(()=> ({}))
  const live = !!body?.live
  const LIVE_ENABLED = envBool('LIVE_ENABLED', false)
  const PAPER_STABILITY_HOURS = envNum('PAPER_STABILITY_HOURS', 48)
  if (live && !LIVE_ENABLED) return NextResponse.json({ ok:false, error:'LIVE_DISABLED' }, { status: 403 })
  // Not: PAPER_STABILITY_HOURS için burada placeholder; gerçek ölçüm telemetri ile yapılmalı
  return NextResponse.json({ ok: true, started: body, guardrails: { live, LIVE_ENABLED, PAPER_STABILITY_HOURS } })
} 
