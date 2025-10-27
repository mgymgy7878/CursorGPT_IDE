import axios from "axios"
import crypto from "crypto"
import { logWarn } from "../apps/web-next/server/log"
import { getBaseUrl } from "./BybitService"

export interface OKXConfig {
  apiKey: string
  secretKey: string
  passphrase?: string
  testnet: boolean
  baseUrl?: string
  demo?: boolean
}

export interface OKXOrder {
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT'
  quantity: number
  price?: number
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
  reduceOnly?: boolean
  posSide?: 'long'|'short'|'net'
}

export interface OKXAccountSummary {
  totalWalletBalance: number
  availableBalance: number
  totalUnrealizedProfit: number
}

export interface OKXPosition {
  symbol: string
  side: 'LONG' | 'SHORT'
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
}

export default class OKXService {
  constructor(private readonly cfg: OKXConfig) {}
  private isDemo() { return this.cfg.demo === true }

  // OKX v5 imzalama
  // Doc: https://www.okx.com/docs-v5/en/#rest-api-authentication
  // prehash = timestamp + method + requestPath + (queryString or body)
  private sign(ts: string, method: string, path: string, body: string) {
    const prehash = `${ts}${method}${path}${body}`
    return crypto.createHmac('sha256', this.cfg.secretKey).update(prehash).digest('base64')
  }

  private async request(method: 'GET'|'POST'|'DELETE', path: string, params: any = {}, signed = false) {
    if (this.isDemo() && signed) throw new Error('demo-mode-request-blocked')

    const ts = new Date().toISOString()
    const requestPath = path + (method==='GET'||method==='DELETE' ? (Object.keys(params).length? `?${new URLSearchParams(params).toString()}`:'') : '')
    const base = this.cfg.baseUrl || getBaseUrl('okx', this.cfg.testnet)
    const url = `${base}${requestPath}`

    let body = ''
    let data: any = undefined
    if (method === 'POST') { body = JSON.stringify(params || {}); data = params }

    const headers: any = { 'Content-Type': 'application/json' }
    if (signed) {
      headers['OK-ACCESS-KEY'] = this.cfg.apiKey
      headers['OK-ACCESS-PASSPHRASE'] = this.cfg.passphrase || ''
      headers['OK-ACCESS-TIMESTAMP'] = ts
      headers['OK-ACCESS-SIGN'] = this.sign(ts, method, path, body)
      // OKX practice/test ortamı için simülasyon header'ı
      if (this.cfg.testnet) headers['x-simulated-trading'] = '1'
    }

    const resp = await axios.request({ method, url, data, headers, validateStatus:()=>true })
    if (resp.status === 429) { const e:any = new Error('okx rate limited'); e.code=429; logWarn('🚨 429 RATE LIMIT — retry %d ms sonra denenecek', { highlight:true }, 300); throw e }
    if (resp.status >= 400 || resp.data?.code !== '0' && resp.data?.code !== 0 && resp.data?.code !== undefined) {
      throw new Error(resp.data?.msg || `okx error ${resp.status}`)
    }
    return resp.data
  }

  // Futures (linear) hesap özeti
  async getAccountInfo(): Promise<OKXAccountSummary> {
    if (this.isDemo()) return { totalWalletBalance: 2000, availableBalance: 1990, totalUnrealizedProfit: 10 }
    const d = await this.request('GET', '/api/v5/account/balance', {}, true)
    const details = d?.data?.[0]?.details || []
    const usdt = details.find((c:any)=> c.ccy==='USDT') || {}
    return {
      totalWalletBalance: Number(usdt?.eqUsd || usdt?.cashBal || 0),
      availableBalance: Number(usdt?.availBal || 0),
      totalUnrealizedProfit: Number(usdt?.upl || 0),
    }
  }

  async getPositions(): Promise<OKXPosition[]> {
    if (this.isDemo()) return []
    const d = await this.request('GET', '/api/v5/account/positions', { instType:'FUTURES' }, true)
    const list: any[] = d?.data || []
    return list.filter(p=> Number(p.pos||p.posQty)>0).map(p=> ({
      symbol: p.instId,
      side: (p.posSide?.toLowerCase()==='long') ? 'LONG' : 'SHORT',
      size: Number(p.pos || p.posQty || 0),
      entryPrice: Number(p.avgPx || 0),
      markPrice: Number(p.markPx || 0),
      pnl: Number(p.upl || 0),
    }))
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    if (this.isDemo()) return []
    const d = await this.request('GET', '/api/v5/trade/orders-pending', { instType:'FUTURES', instId: symbol }, true)
    return d?.data || []
  }

  async placeMarketOrder(order: OKXOrder): Promise<any> {
    if (this.isDemo()) return { orderId: String(Date.now()) }
    const body:any = [{
      instId: order.symbol,
      tdMode: 'cross',
      side: order.side.toLowerCase(),
      ordType: 'market',
      sz: String(order.quantity),
      reduceOnly: order.reduceOnly ? 'true' : 'false',
      posSide: order.posSide || 'net',
    }]
    return await this.request('POST', '/api/v5/trade/order', body, true)
  }

  async placeLimitOrder(order: OKXOrder): Promise<any> {
    if (this.isDemo()) return { orderId: String(Date.now()) }
    const body:any = [{
      instId: order.symbol,
      tdMode: 'cross',
      side: order.side.toLowerCase(),
      ordType: 'limit',
      px: String(order.price),
      sz: String(order.quantity),
      reduceOnly: order.reduceOnly ? 'true' : 'false',
      posSide: order.posSide || 'net',
      tif: order.timeInForce || 'GTC',
    }]
    return await this.request('POST', '/api/v5/trade/order', body, true)
  }

  async cancelOrder(symbol: string, orderId: string): Promise<any> {
    if (this.isDemo()) return { ok: true }
    // POST /api/v5/trade/cancel-order
    const body:any = [{ instId: symbol, ordId: orderId }]
    return await this.request('POST', '/api/v5/trade/cancel-order', body, true)
  }

  async closePosition(symbol: string, side: 'LONG'|'SHORT', qty: number, price?: number): Promise<any> {
    if (this.isDemo()) return { ok: true }
    const isLong = side==='LONG'
    const ord = {
      symbol,
      side: isLong ? 'SELL' : 'BUY' as 'SELL'|'BUY',
      type: price ? 'LIMIT' as const : 'MARKET' as const,
      quantity: qty,
      price,
      reduceOnly: true,
      posSide: isLong ? 'long' as const : 'short' as const,
    }
    return price ? this.placeLimitOrder(ord as any) : this.placeMarketOrder(ord as any)
  }
} 