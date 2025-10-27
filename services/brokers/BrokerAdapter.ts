export type MarketKind = 'crypto' | 'equity' | 'futures' | 'forex' | 'commodity'

export interface Tick {
  time: number // epoch ms
  price: number
  volume?: number
}

export interface BrokerAdapter {
  id: string
  supports: { market: MarketKind; venues: string[] }

  fetchSymbols(): Promise<string[]>
  fetchBalances(): Promise<Record<string, number>>

  placeOrder(input: {
    symbol: string
    side: 'BUY' | 'SELL'
    type: 'MARKET' | 'LIMIT'
    qty: number
    price?: number
    tif?: 'GTC' | 'IOC' | 'FOK'
  }): Promise<{ orderId: string }>

  cancelOrder(orderId: string, params: { symbol: string }): Promise<void>

  subscribeTicks(symbol: string, onTick: (t: Tick) => void): () => void
} 