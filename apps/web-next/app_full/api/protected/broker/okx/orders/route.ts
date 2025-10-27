// moved from pages/api/broker/okx/orders.ts to app/api/protected/broker/okx/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import OKXService from "../../../../../../server/okx"
import { loadOkxCreds } from "../../../../../../server/creds"
import { withRetry } from "../../../../../../server/util"

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get('symbol') || undefined
    const creds = loadOkxCreds()
    if (!creds) return NextResponse.json({ success:true, data: [] }, { status: 200 })
    const baseUrl = creds.testnet ? 'https://www.okx.com' : 'https://www.okx.com'
    const svc = new OKXService({ apiKey: creds.apiKey, secretKey: creds.secretKey, passphrase: creds.passphrase, testnet: creds.testnet, baseUrl, demo: creds.demo })
    const data = await withRetry(() => svc.getOpenOrders(symbol))
    return NextResponse.json({ success:true, data }, { status: 200 })
  } catch (e:any) {
    return NextResponse.json({ success:false, error:{ message: e?.message || 'failed' } }, { status: 400 })
  }
} 
