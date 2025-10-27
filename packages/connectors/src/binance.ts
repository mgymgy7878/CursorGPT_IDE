import type { ExchangeAdapter } from "./adapter";

export const binance = {
  async balance() { return [] },
  async positions() { return [] },
  async placeOrder(opts: { symbol:string; side:'BUY'|'SELL'; qty:number; price?:number; type:'MARKET'|'LIMIT' }) {
    return { orderId: `bn_${Date.now()}` }
  },
  async closeAll(symbol: string) { return { ok:true, symbol } }
} 