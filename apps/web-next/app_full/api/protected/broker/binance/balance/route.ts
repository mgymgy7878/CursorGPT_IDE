// moved from pages/api/broker/binance/balance.ts to app/api/protected/broker/binance/balance/route.ts
import { NextRequest, NextResponse } from "next/server"
import BinanceService from "../../../../../../server/BinanceService"
import { loadBinanceCreds } from "../../../../../../server/creds"
import { withRetry } from "../../../../../../server/util"

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const creds = loadBinanceCreds()
    if (!creds || creds.demo) return NextResponse.json({ success: true, data: null }, { status: 200 })
    const baseUrl = creds.testnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com'
    const binance = new BinanceService({ apiKey: creds.apiKey, secretKey: creds.secretKey, testnet: creds.testnet, baseUrl })
    const data = await withRetry(() => binance.getAccountInfo())
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { message: e?.message || 'failed' } }, { status: 400 })
  }
} 
