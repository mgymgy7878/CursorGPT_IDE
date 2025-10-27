import BinanceService from "../BinanceService"
import { MarketDataProvider, Bar } from "./MarketDataProvider"

const intervalMap: Record<'1m'|'5m'|'15m'|'1h'|'4h'|'1d'|'1w'|'1M', string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w', '1M': '1M'
}

export default class BinanceMarketData implements MarketDataProvider {
  constructor(private readonly service: BinanceService) {}

  async getHistorical(params: { symbol: string; interval: '1m'|'5m'|'15m'|'1h'|'4h'|'1d'|'1w'|'1M'; from: number; to: number; limit?: number }): Promise<Bar[]> {
    const interval = intervalMap[params.interval]
    const res: any[] = await (this.service as any).getKlines(params.symbol, interval, params.from, params.to, params.limit)
    return res.map((k) => {
      const [openTime, open, high, low, close, volume, closeTime] = [k[0], parseFloat(k[1]), parseFloat(k[2]), parseFloat(k[3]), parseFloat(k[4]), parseFloat(k[5]), k[6]]
      return { time: closeTime, open, high, low, close, volume }
    })
  }

  stream(params: { symbol: string; interval: '1m' | '5m' | '15m' }, onBar: (bar: Bar) => void): () => void {
    // Basit 1 dakikalık bar birleştirici (ticker fiyatından)
    let currentBucketStart = 0
    let current: Bar | null = null

    const unsubscribe = this.service.connectWebSocket([params.symbol], (msg: any) => {
      const price = parseFloat(msg.c ?? msg.p ?? msg.lastPrice)
      if (isNaN(price)) return
      const now = Date.now()
      const bucket = Math.floor(now / 60000) * 60000

      if (!current || bucket !== currentBucketStart) {
        if (current) onBar({ ...current })
        currentBucketStart = bucket
        current = { time: bucket, open: price, high: price, low: price, close: price, volume: 0 }
        onBar({ ...current }) // ilk bar snapshot’ı
      } else {
        current.high = Math.max(current.high, price)
        current.low = Math.min(current.low, price)
        current.close = price
        onBar({ ...current })
      }
    }) as unknown as () => void

    return () => {
      try { unsubscribe?.() } catch {}
    }
  }
} 