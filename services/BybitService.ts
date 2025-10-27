import axios from "axios"
import crypto from "crypto"
import { logWarn } from "../apps/web-next/server/log"

export interface BybitConfig {
  apiKey: string
  secretKey: string
  testnet: boolean
  baseUrl?: string
  demo?: boolean
}

export interface BybitOrder {
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT'
  quantity: number
  price?: number
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
  reduceOnly?: boolean
  positionIdx?: 0 | 1 | 2 // 0: one-way, 1: long, 2: short (hedge)
}

export interface BybitAccountSummary {
  totalWalletBalance: number
  availableBalance: number
  totalUnrealizedProfit: number
}

export interface BybitPosition {
  symbol: string
  side: 'LONG' | 'SHORT'
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
}

export default class BybitService {
  constructor(private readonly cfg: BybitConfig) {}

  private isDemo() { return this.cfg.demo === true }

  // Bybit v5 imzalama
  // Doc: https://bybit-exchange.github.io/docs/v5/intro
  // prehash = timestamp + api_key + recv_window + (queryString | bodyJson)
  private sign(timestamp: string, recvWindow: string, dataStr: string) {
    const prehash = `${timestamp}${this.cfg.apiKey}${recvWindow}${dataStr}`
    return crypto.createHmac('sha256', this.cfg.secretKey).update(prehash).digest('hex')
  }

  private toQs(params: Record<string, any>) {
    const usp = new URLSearchParams()
    Object.entries(params).filter(([,v])=> v!==undefined && v!==null && v!=='').sort(([a],[b])=> a.localeCompare(b)).forEach(([k,v])=> usp.append(k, String(v)))
    return usp.toString()
  }

  private async request(method: 'GET'|'POST'|'DELETE', endpoint: string, params: any = {}, signed = false) {
    if (this.isDemo() && signed) throw new Error('demo-mode-request-blocked')

    const base = this.cfg.baseUrl || getBaseUrl('bybit', this.cfg.testnet)
    const url = `${base}${endpoint}`
    const headers: any = { 'Content-Type': 'application/json' }

    let data: any = undefined
    let query = ''
    if (method === 'GET' || method === 'DELETE') {
      query = this.toQs(params)
    } else {
      data = params
    }

    if (signed) {
      const timestamp = String(Date.now())
      const recvWindow = '5000'
      const dataStr = method === 'GET' || method === 'DELETE' ? query : JSON.stringify(data || {})
      const sign = this.sign(timestamp, recvWindow, dataStr)
      headers['X-BAPI-API-KEY'] = this.cfg.apiKey
      headers['X-BAPI-TIMESTAMP'] = timestamp
      headers['X-BAPI-RECV-WINDOW'] = recvWindow
      headers['X-BAPI-SIGN'] = sign
    }

    try {
      const resp = await axios.request({
        method,
        url: query ? `${url}?${query}` : url,
        headers,
        data,
        validateStatus: ()=> true,
      })
      if (resp.status === 429) {
        const nextDelayGuess = 300
        logWarn(`🚨 429 RATE LIMIT — retry %d ms sonra denenecek`, { highlight: true }, nextDelayGuess)
        const err: any = new Error('bybit rate limited')
        err.code = 429
        throw err
      }
      if (resp.status >= 400 || resp.data?.retCode > 0) {
        throw new Error(resp.data?.retMsg || `bybit error ${resp.status}`)
      }
      return resp.data
    } catch (e:any) {
      throw e
    }
  }

  // ---- Public API wrappers (USDT perpetual / linear)
  async getAccountInfo(): Promise<BybitAccountSummary> {
    if (this.isDemo()) {
      return { totalWalletBalance: 1000, availableBalance: 995, totalUnrealizedProfit: 5 }
    }
    // GET /v5/account/wallet-balance?accountType=UNIFIED
    const d = await this.request('GET', '/v5/account/wallet-balance', { accountType: 'UNIFIED' }, true)
    const list = d?.result?.list?.[0]
    const usdt = (list?.coin || []).find((c:any)=> c.coin === 'USDT') || {}
    const totalWalletBalance = Number(usdt?.walletBalance || 0)
    const availableBalance = Number(usdt?.availableToWithdraw || usdt?.availableBalance || 0)
    const totalUnrealizedProfit = Number(usdt?.unrealisedPnl || 0)
    return { totalWalletBalance, availableBalance, totalUnrealizedProfit }
  }

  async getPositions(): Promise<BybitPosition[]> {
    if (this.isDemo()) return []
    // GET /v5/position/list?category=linear
    const d = await this.request('GET', '/v5/position/list', { category:'linear' }, true)
    const list: any[] = d?.result?.list || []
    return list
      .filter(p=> Number(p.size)>0)
      .map(p=> ({
        symbol: p.symbol,
        side: (p.side?.toUpperCase() === 'BUY') ? 'LONG' : 'SHORT',
        size: Number(p.size),
        entryPrice: Number(p.avgPrice || p.entryPrice || 0),
        markPrice: Number(p.markPrice || 0),
        pnl: Number(p.unrealisedPnl || 0)
      }))
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    if (this.isDemo()) return []
    // GET /v5/order/realtime?category=linear
    const d = await this.request('GET', '/v5/order/realtime', { category:'linear', symbol }, true)
    return d?.result?.list || []
  }

  async placeMarketOrder(order: BybitOrder): Promise<any> {
    if (this.isDemo()) return { orderId: String(Date.now()) }
    // POST /v5/order/create (category=linear)
    const body: any = {
      category: 'linear',
      symbol: order.symbol,
      side: order.side,
      orderType: 'Market',
      qty: String(order.quantity),
      reduceOnly: order.reduceOnly ?? false,
    }
    if (order.positionIdx!=null) body.positionIdx = order.positionIdx
    return await this.request('POST', '/v5/order/create', body, true)
  }

  async placeLimitOrder(order: BybitOrder): Promise<any> {
    if (this.isDemo()) return { orderId: String(Date.now()) }
    const body: any = {
      category: 'linear',
      symbol: order.symbol,
      side: order.side,
      orderType: 'Limit',
      qty: String(order.quantity),
      price: String(order.price),
      timeInForce: order.timeInForce || 'GTC',
      reduceOnly: order.reduceOnly ?? false,
    }
    if (order.positionIdx!=null) body.positionIdx = order.positionIdx
    return await this.request('POST', '/v5/order/create', body, true)
  }

  async cancelOrder(symbol: string, orderId: string): Promise<any> {
    if (this.isDemo()) return { ok: true }
    // POST /v5/order/cancel (category=linear)
    const body: any = { category: 'linear', symbol, orderId }
    return await this.request('POST', '/v5/order/cancel', body, true)
  }

  async closePosition(symbol: string, side: 'LONG'|'SHORT', qty: number, price?: number): Promise<any> {
    if (this.isDemo()) return { ok: true }
    // Hedge desteği: LONG kapatmak için SELL; SHORT kapatmak için BUY, reduceOnly=true, positionIdx set
    const isLong = side === 'LONG'
    const req = {
      symbol,
      side: isLong ? 'SELL' : 'BUY' as 'SELL'|'BUY',
      type: price ? 'LIMIT' as const : 'MARKET' as const,
      quantity: qty,
      price,
      reduceOnly: true,
      positionIdx: isLong ? 1 : 2 as 1|2,
    }
    return price ? this.placeLimitOrder(req as any) : this.placeMarketOrder(req as any)
  }
}

export function getBaseUrl(exchange: 'bybit'|'okx', isTestnet: boolean): string {
  if (exchange === 'bybit') return isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com'
  // okx base URL is the same domain but kept for API parity
  return isTestnet ? 'https://www.okx.com' : 'https://www.okx.com'
} 