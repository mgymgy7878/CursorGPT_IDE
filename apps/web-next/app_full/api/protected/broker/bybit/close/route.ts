// moved from pages/api/broker/bybit/close.ts to app/api/protected/broker/bybit/close/route.ts
import { NextRequest, NextResponse } from "next/server"
import BybitService from "../../../../../../server/bybit"
import { loadBybitCreds } from "../../../../../../server/creds"
import { audit } from "@spark/security"
import { extractBearer, verifyToken, isDevAuth } from "@spark/auth"

export const runtime = 'nodejs'

function ipOf(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1'
}

function claimsOf(req: NextRequest): { sub?: string; role?: string } {
  if (isDevAuth()) return { sub: req.headers.get('x-dev-sub') || 'dev-user-1', role: req.headers.get('x-dev-role') || 'admin' }
  const tok = extractBearer(req.headers.get('authorization'))
  if (!tok) return {}
  try { const c = verifyToken(tok as string); return { sub: c.sub, role: c.role } } catch { return {} }
}

export async function POST(req: NextRequest) {
  const ip = ipOf(req)
  const who = claimsOf(req)
  try {
    const { symbol, side, quantity, price } = await req.json()
    if (!symbol || !side || !quantity) {
      const res = NextResponse.json({ success:false, error:{ message:'symbol/side/quantity required' } }, { status: 400 })
      await audit({ ts: Date.now(), actor: who.sub, role: who.role, ip, method: req.method, path: req.nextUrl.pathname, status: 400, ok: false, meta: { broker:'bybit', op:'close' } })
      return res
    }

    const creds = loadBybitCreds()
    if (!creds) {
      const res = NextResponse.json({ success: true, data: { demo:true } }, { status: 200 })
      await audit({ ts: Date.now(), actor: who.sub, role: who.role, ip, method: req.method, path: req.nextUrl.pathname, status: 200, ok: true, meta: { broker:'bybit', op:'close', demo:true } })
      return res
    }
    const baseUrl = creds.testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com'
    const svc = new BybitService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl, demo: creds.demo })

    const out = await svc.closePosition(symbol, side, Number(quantity), price!=null? Number(price): undefined)
    const res = NextResponse.json({ success:true, data: out }, { status: 200 })
    await audit({ ts: Date.now(), actor: who.sub, role: who.role, ip, method: req.method, path: req.nextUrl.pathname, status: 200, ok: true, meta: { broker:'bybit', op:'close' } })
    return res
  } catch (e:any) {
    const res = NextResponse.json({ success:false, error:{ message: e?.message || 'failed' } }, { status: 400 })
    await audit({ ts: Date.now(), actor: who.sub, role: who.role, ip, method: req.method, path: req.nextUrl.pathname, status: 400, ok: false, meta: { broker:'bybit', op:'close', err: e?.message } })
    return res
  }
} 
