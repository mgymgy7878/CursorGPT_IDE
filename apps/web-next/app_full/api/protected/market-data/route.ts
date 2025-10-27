// moved from pages/api/market-data.ts to app/api/protected/market-data/route.ts
import { NextRequest, NextResponse } from "next/server"
import { MarketDataParamsSchema } from "@spark/shared"
import { getKlines } from "@spark/connectors"
import { memoGet, memoSet } from "../../../../server/cache"

type Kline = { openTime:number; open:number; high:number; low:number; close:number; volume:number; closeTime:number }
const map: Record<string,string> = { '1m':'1m','5m':'5m','15m':'15m','1h':'1h','4h':'4h','1d':'1d' }

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const input = MarketDataParamsSchema.parse({
      symbol: sp.get('symbol'),
      timeframe: sp.get('timeframe'),
      start: Number(sp.get('start')),
      end: Number(sp.get('end'))
    })
    const interval = map[input.timeframe]
    const key = `${input.symbol}_${interval}_${input.start}_${input.end}`
    const cached = memoGet<any[]>(key)
    if (cached) return NextResponse.json({ success:true, data: cached }, { status: 200 })

    let bars: any[] = []
    try {
      const kl: Kline[] = await getKlines(input.symbol, interval, input.start, input.end) as any
      bars = kl.map((k: Kline) => ({
        symbol: input.symbol, timeframe: input.timeframe,
        openTime: k.openTime, open: k.open, high: k.high, low: k.low, close: k.close,
        volume: k.volume, closeTime: k.closeTime
      }))
      memoSet(key, bars, 60_000)
    } catch {
      // fixture fallback
      const n = 200
      const start = input.start
      let price = 100
      for (let i=0;i<n;i++){
        const t = start + i*60_000
        const o = price, c = price + (Math.random()-0.5)*2
        const h = Math.max(o,c) + Math.random(); const l = Math.min(o,c) - Math.random()
        bars.push({ symbol: input.symbol, timeframe: input.timeframe, openTime: t, open:o, high:h, low:l, close:c, volume: 1, closeTime: t+60_000 })
        price = c
      }
    }
    return NextResponse.json({ success:true, data: bars }, { status: 200 })
  } catch (e:any) {
    return NextResponse.json({ success:false, error:{ message: e?.message ?? 'invalid' }}, { status: 400 })
  }
} 
