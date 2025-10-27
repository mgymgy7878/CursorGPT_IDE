import axios from "axios"
import crypto from "crypto"
import WebSocket from "ws"
import type { WebSocket as WebSocketType, RawData } from "ws"

export interface BinanceConfig {
  apiKey: string
  secretKey: string
  testnet: boolean
  baseUrl: string
}

export interface BinanceOrder {
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT'
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
}

export interface BinancePosition {
  symbol: string
  side: 'LONG' | 'SHORT'
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
  pnlPercent: number
  leverage: number
  marginType: 'isolated' | 'cross'
}

export interface BinanceAccount {
  totalWalletBalance: number
  totalUnrealizedProfit: number
  totalMarginBalance: number
  totalPositionInitialMargin: number
  totalOpenOrderInitialMargin: number
  totalCrossWalletBalance: number
  totalCrossUnPnl: number
  availableBalance: number
  maxWithdrawAmount: number
}

class BinanceService {
  private config: BinanceConfig
  private wsConnection: WebSocketType | null = null
  private isConnected: boolean = false

  constructor(config: BinanceConfig) {
    this.config = config
  }

  // REST API istekleri için imza oluştur
  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(queryString)
      .digest('hex')
  }

  // REST API isteği gönder
  private async makeRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: any = {},
    signed: boolean = false
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`
    
    if (signed) {
      params.timestamp = Date.now()
      params.recvWindow = 5000
    }

    const queryString = new URLSearchParams(params).toString()
    const signature = signed ? this.createSignature(queryString) : ''
    
    const headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    if (signed) {
      headers['X-MBX-APIKEY'] = this.config.apiKey
    }

    try {
      let response
      if (method === 'GET') {
        response = await axios.get(`${url}?${queryString}${signed ? `&signature=${signature}` : ''}`, { headers })
      } else if (method === 'DELETE') {
        response = await axios.delete(`${url}?${queryString}${signed ? `&signature=${signature}` : ''}`, { headers })
      } else {
        response = await axios.post(url, queryString + (signed ? `&signature=${signature}` : ''), { headers })
      }

      return response.data
    } catch (error: any) {
      console.error('Binance API hatası:', error.response?.data || error.message)
      throw new Error(`Binance API hatası: ${error.response?.data?.msg || error.message}`)
    }
  }

  // Kline (historical) verileri
  async getKlines(symbol: string, interval: string, startTime?: number, endTime?: number, limit: number = 500): Promise<any[]> {
    const params: any = { symbol, interval, limit }
    if (startTime) params.startTime = startTime
    if (endTime) params.endTime = endTime
    return await this.makeRequest('GET', '/fapi/v1/klines', params)
  }

  // Hesap bilgilerini al
  async getAccountInfo(): Promise<BinanceAccount> {
    const response = await this.makeRequest('GET', '/fapi/v2/account', {}, true)
    
    return {
      totalWalletBalance: parseFloat(response.totalWalletBalance),
      totalUnrealizedProfit: parseFloat(response.totalUnrealizedProfit),
      totalMarginBalance: parseFloat(response.totalMarginBalance),
      totalPositionInitialMargin: parseFloat(response.totalPositionInitialMargin),
      totalOpenOrderInitialMargin: parseFloat(response.totalOpenOrderInitialMargin),
      totalCrossWalletBalance: parseFloat(response.totalCrossWalletBalance),
      totalCrossUnPnl: parseFloat(response.totalCrossUnPnl),
      availableBalance: parseFloat(response.availableBalance),
      maxWithdrawAmount: parseFloat(response.maxWithdrawAmount)
    }
  }

  // Pozisyonları al
  async getPositions(): Promise<BinancePosition[]> {
    const response = await this.makeRequest('GET', '/fapi/v2/positionRisk', {}, true)
    
    return response
      .filter((pos: any) => parseFloat(pos.positionAmt) !== 0)
      .map((pos: any) => ({
        symbol: pos.symbol,
        side: parseFloat(pos.positionAmt) > 0 ? 'LONG' : 'SHORT',
        size: Math.abs(parseFloat(pos.positionAmt)),
        entryPrice: parseFloat(pos.entryPrice),
        markPrice: parseFloat(pos.markPrice),
        pnl: parseFloat(pos.unRealizedProfit),
        pnlPercent: parseFloat(pos.unRealizedProfit) / parseFloat(pos.positionInitialMargin) * 100,
        leverage: parseFloat(pos.leverage),
        marginType: pos.marginType
      }))
  }

  // Market emri gönder
  async placeMarketOrder(order: BinanceOrder): Promise<any> {
    const params = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity.toString()
    }

    return await this.makeRequest('POST', '/fapi/v1/order', params, true)
  }

  // Limit emri gönder
  async placeLimitOrder(order: BinanceOrder): Promise<any> {
    const params = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity.toString(),
      price: order.price?.toString(),
      timeInForce: order.timeInForce || 'GTC'
    }

    return await this.makeRequest('POST', '/fapi/v1/order', params, true)
  }

  // Stop Loss emri gönder
  async placeStopLossOrder(order: BinanceOrder): Promise<any> {
    const params = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity.toString(),
      stopPrice: order.stopPrice?.toString()
    }

    return await this.makeRequest('POST', '/fapi/v1/order', params, true)
  }

  // Emri iptal et
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    const params = {
      symbol,
      orderId: orderId.toString()
    }

    return await this.makeRequest('DELETE', '/fapi/v1/order', params, true)
  }

  // Açık emirleri al
  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params = symbol ? { symbol } : {}
    return await this.makeRequest('GET', '/fapi/v1/openOrders', params, true)
  }

  // Fiyat bilgisi al
  async getPrice(symbol: string): Promise<number> {
    const response = await this.makeRequest('GET', '/fapi/v1/ticker/price', { symbol })
    return parseFloat(response.price)
  }

  // 24 saatlik istatistikler
  async get24hrStats(symbol: string): Promise<any> {
    const response = await this.makeRequest('GET', '/fapi/v1/ticker/24hr', { symbol })
    return {
      symbol: response.symbol,
      priceChange: parseFloat(response.priceChange),
      priceChangePercent: parseFloat(response.priceChangePercent),
      weightedAvgPrice: parseFloat(response.weightedAvgPrice),
      prevClosePrice: parseFloat(response.prevClosePrice),
      lastPrice: parseFloat(response.lastPrice),
      lastQty: parseFloat(response.lastQty),
      openPrice: parseFloat(response.openPrice),
      highPrice: parseFloat(response.highPrice),
      lowPrice: parseFloat(response.lowPrice),
      volume: parseFloat(response.volume),
      quoteVolume: parseFloat(response.quoteVolume),
      openTime: response.openTime,
      closeTime: response.closeTime,
      count: response.count
    }
  }

  // WebSocket bağlantısı kur
  connectWebSocket(symbols: string[], onMessage: (data: any) => void): void {
    const wsUrl = this.config.testnet 
      ? 'wss://stream.binancefuture.com/ws'
      : 'wss://fstream.binance.com/ws'

    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
    const fullUrl = `${wsUrl}/${streams}`

    this.wsConnection = new WebSocket(fullUrl)

    this.wsConnection.on('open', () => {
      console.log('🔌 Binance WebSocket bağlantısı kuruldu')
      this.isConnected = true
    })

    this.wsConnection.on('message', (event: RawData) => {
      try {
        const data = JSON.parse(event.toString())
        onMessage(data)
      } catch (error) {
        console.error('WebSocket mesaj parse hatası:', error)
      }
    })

    this.wsConnection.on('error', (error: Error) => {
      console.error('WebSocket hatası:', error)
      this.isConnected = false
    })

    this.wsConnection.on('close', () => {
      console.log('WebSocket bağlantısı kapandı')
      this.isConnected = false
    })
  }

  // WebSocket bağlantısını kapat
  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
      this.isConnected = false
    }
  }

  // Bağlantı durumu
  isWebSocketConnected(): boolean {
    return this.isConnected
  }

  // Test bağlantısı
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/fapi/v1/ping')
      return true
    } catch (error) {
      console.error('Binance bağlantı testi başarısız:', error)
      return false
    }
  }

  // Server zamanı
  async getServerTime(): Promise<number> {
    const response = await this.makeRequest('GET', '/fapi/v1/time')
    return response.serverTime
  }

  // Exchange bilgileri
  async getExchangeInfo(): Promise<any> {
    return await this.makeRequest('GET', '/fapi/v1/exchangeInfo')
  }
}

export default BinanceService 