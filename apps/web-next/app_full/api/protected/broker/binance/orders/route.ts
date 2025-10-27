// moved from pages/api/broker/binance/orders.ts to app/api/protected/broker/binance/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import BinanceService from "../../../../../../server/BinanceService"
import { loadBinanceCreds } from "../../../../../../server/creds"

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const symbol = sp.get('symbol') || undefined
    const creds = loadBinanceCreds()
    if (!creds || creds.demo) return NextResponse.json({ success: true, data: [] }, { status: 200 })
    const baseUrl = creds.testnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com'
    const binance = new BinanceService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl })
    const data = await binance.getOpenOrders(symbol)
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { message: e?.message || 'failed' } }, { status: 400 })
  }
} 
