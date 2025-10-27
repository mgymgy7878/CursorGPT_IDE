// moved from pages/api/strategy/compile.ts to app/api/admin/strategy/compile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit, audit } from "@spark/security"
import { isDevAuth, extractBearer, verifyToken, type JwtClaims } from "@spark/auth"

export const runtime = 'nodejs'

const RL_LIMIT = parseInt(process.env.RL_ADMIN_LIMIT || '30')
const RL_WINDOW = parseInt(process.env.RL_ADMIN_WINDOW_MS || '60000')

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

  const res = NextResponse.json({ success:true, data: { diagnostics: [] } }, { status: 200 })
  await audit({ ts: Date.now(), ...claimsOf(req), ip, method: req.method, path: req.nextUrl.pathname, status: 200, ok: true })
  return res
} 
