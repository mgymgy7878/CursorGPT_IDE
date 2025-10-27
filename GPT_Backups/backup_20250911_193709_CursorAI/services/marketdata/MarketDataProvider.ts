export type Interval = 'tick' | '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M'

export interface Bar {
  time: number // epoch ms
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface MarketDataProvider {
  getHistorical(params: {
    symbol: string
    interval: Exclude<Interval, 'tick' | '1s'>
    from: number // epoch ms
    to: number // epoch ms
    limit?: number
  }): Promise<Bar[]>

  stream(params: { symbol: string; interval: '1m' | '5m' | '15m' }, onBar: (bar: Bar) => void): () => void
} 