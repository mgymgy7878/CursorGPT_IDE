import BinanceService, { BinanceOrder } from "../BinanceService"
import { BrokerAdapter, Tick } from "./BrokerAdapter"

export default class BinanceAdapter implements BrokerAdapter {
  public readonly id = 'binance'
  public readonly supports = { market: 'crypto' as const, venues: ['binance-futures'] }

  constructor(private readonly service: BinanceService) {}

  async fetchSymbols(): Promise<string[]> {
    const info = await this.service.getExchangeInfo()
    const symbols: string[] = (info.symbols || [])
      .filter((s: any) => s.status === 'TRADING')
      .map((s: any) => s.symbol)
    return symbols
  }

  async fetchBalances(): Promise<Record<string, number>> {
    const acc = await this.service.getAccountInfo()
    return {
      USDT: acc.availableBalance,
      wallet: acc.totalWalletBalance,
    }
  }

  async placeOrder(input: { symbol: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT'; qty: number; price?: number; tif?: 'GTC' | 'IOC' | 'FOK' }): Promise<{ orderId: string }> {
    const order: BinanceOrder = {
      symbol: input.symbol,
      side: input.side,
      type: input.type,
      quantity: input.qty,
      price: input.price,
      timeInForce: input.tif,
    }

    const res = input.type === 'MARKET' ? await this.service.placeMarketOrder(order) : await this.service.placeLimitOrder(order)
    return { orderId: String(res.orderId) }
  }

  async cancelOrder(orderId: string, params: { symbol: string }): Promise<void> {
    await this.service.cancelOrder(params.symbol, parseInt(orderId, 10))
  }

  subscribeTicks(symbol: string, onTick: (t: Tick) => void): () => void {
    // BinanceService şu an tek bir WS bağlantısı tutuyor; basit kullanım: tek sembol için bağlan.
    this.service.connectWebSocket([symbol], (msg: any) => {
      try {
        const price = parseFloat(msg.c ?? msg.p ?? msg.lastPrice)
        if (!isNaN(price)) {
          onTick({ time: Date.now(), price })
        }
      } catch {}
    })
    return () => this.service.disconnectWebSocket()
  }
} 