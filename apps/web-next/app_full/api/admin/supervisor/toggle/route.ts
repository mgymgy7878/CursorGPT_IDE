// moved from pages/api/supervisor/toggle.ts to app/api/admin/supervisor/toggle/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupervisor } from "../../../../../server/supervisor"
import { enforceRateLimit, audit } from "@spark/security"
import { isDevAuth, extractBearer, verifyToken, type JwtClaims } from "@spark/auth"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RL_LIMIT = parseInt(process.env.RL_ADMIN_LIMIT || '30')
const RL_WINDOW = parseInt(process.env.RL_ADMIN_WINDOW_MS || '60000')

type ToggleBody = { run: boolean }

function bad(message: string, code = 400) {
  return NextResponse.json({ success: false, error: message }, { status: code })
}

function ipOf(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1'
}

function claimsOf(req: NextRequest): { sub?: string; role?: JwtClaims['role'] } {
  if (isDevAuth()) return { sub: req.headers.get('x-dev-sub') || undefined, role: (req.headers.get('x-dev-role') as any) || 'admin' }
  const token = extractBearer(req.headers.get('authorization'))
  if (!token) return {}
  try { const c = verifyToken(token); return { sub: c.sub, role: c.role } } catch { return {} }
}

export async function POST(req: NextRequest) {
  const ip = ipOf(req)
  const rlKey = `admin:${req.nextUrl.pathname}:${ip}`
  const rl = await enforceRateLimit(rlKey, RL_LIMIT, RL_WINDOW)
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Rate limit' }, { status: 429, headers: { 'retry-after': Math.ceil((rl.retryAfterMs || 1000)/1000).toString() } })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    const res = bad('Invalid JSON', 400)
    await audit({ ts: Date.now(), ...claimsOf(req), ip, method: req.method, path: req.nextUrl.pathname, status: 400, ok: false, meta: { reason: 'invalid_json' } })
    return res
  }

  if (!body || typeof (body as any).run !== 'boolean') {
    const res = bad('`run` must be a boolean', 400)
    await audit({ ts: Date.now(), ...claimsOf(req), ip, method: req.method, path: req.nextUrl.pathname, status: 400, ok: false, meta: { reason: 'invalid_run_type' } })
    return res
  }

  const { run } = body as ToggleBody
  const running = getSupervisor().toggle(run)
  const res = NextResponse.json({ success: true, data: { running } }, { status: 200 })
  await audit({ ts: Date.now(), ...claimsOf(req), ip, method: req.method, path: req.nextUrl.pathname, status: 200, ok: true, meta: { run } })
  return res
}

export async function GET() { return bad('Method Not Allowed', 405) }
export async function PUT() { return bad('Method Not Allowed', 405) }
export async function DELETE() { return bad('Method Not Allowed', 405) } 
