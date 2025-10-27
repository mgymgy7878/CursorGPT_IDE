// moved from pages/api/broker/bybit/balance.ts to app/api/protected/broker/bybit/balance/route.ts
import { NextRequest, NextResponse } from "next/server"
import BybitService from "../../../../../../server/BybitService"
import { loadBybitCreds } from "../../../../../../server/creds"
import { withRetry } from "../../../../../../server/util"

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const creds = loadBybitCreds()
    if (!creds) return NextResponse.json({ success:true, data: null }, { status: 200 })
    const baseUrl = creds.testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com'
    const svc = new BybitService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl, demo: creds.demo })
    const data = await withRetry(() => svc.getAccountInfo())
    return NextResponse.json({ success:true, data }, { status: 200 })
  } catch (e:any) {
    return NextResponse.json({ success:false, error:{ message: e?.message || 'failed' } }, { status: 400 })
  }
} 
