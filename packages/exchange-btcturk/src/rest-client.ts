import crypto from 'crypto';
import { BTCTurkConfig, BTCTurkSymbol, BTCTurkTicker, BTCTurkTrade, BTCTurkOrderBook, BTCTurkKline, BTCTurkAccount, BTCTurkOrder } from './types.js';

export class BTCTurkRESTClient {
  private config: BTCTurkConfig;
  private baseUrl: string;
  private timeout: number;

  constructor(config: BTCTurkConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.btcturk.com/api/v2';
    this.timeout = config.timeout || 10000;
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    signed: boolean = false
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const timestamp = Date.now().toString();
    
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'spark-trading-platform/1.0',
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (signed) {
      const message = timestamp + method.toUpperCase() + endpoint + (data ? JSON.stringify(data) : '');
      const signature = crypto
        .createHmac('sha256', this.config.apiSecret)
        .update(message)
        .digest('base64');
      
      headers['X-PCK'] = this.config.apiKey;
      headers['X-Stamp'] = timestamp;
      headers['X-Signature'] = signature;
    }

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`BTCTurk API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getServerTime(): Promise<number> {
    const response = await this.makeRequest('GET', '/server/time');
    return response.serverTime;
  }

  async getSymbols(): Promise<BTCTurkSymbol[]> {
    const response = await this.makeRequest('GET', '/server/exchangeinfo');
    return response.data || [];
  }

  async getTicker(symbol?: string): Promise<BTCTurkTicker | BTCTurkTicker[]> {
    const endpoint = symbol ? `/ticker?pairSymbol=${symbol}` : '/ticker';
    const response = await this.makeRequest('GET', endpoint);
    return response.data || [];
  }

  async getTrades(symbol: string, limit: number = 50): Promise<BTCTurkTrade[]> {
    const response = await this.makeRequest('GET', `/trades?pairSymbol=${symbol}&last=${limit}`);
    return response.data || [];
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<BTCTurkOrderBook> {
    const response = await this.makeRequest('GET', `/orderbook?pairSymbol=${symbol}&limit=${limit}`);
    return response.data;
  }

  async getKlines(
    symbol: string,
    interval: string = '1h',
    startTime?: number,
    endTime?: number,
    limit: number = 500
  ): Promise<BTCTurkKline[]> {
    let endpoint = `/klines?pairSymbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    if (startTime) endpoint += `&startTime=${startTime}`;
    if (endTime) endpoint += `&endTime=${endTime}`;
    
    const response = await this.makeRequest('GET', endpoint);
    return response.data || [];
  }

  async getAccount(): Promise<BTCTurkAccount[]> {
    const response = await this.makeRequest('GET', '/users/balances', undefined, true);
    return response.data || [];
  }

  async getOpenOrders(symbol?: string): Promise<BTCTurkOrder[]> {
    const endpoint = symbol ? `/openOrders?pairSymbol=${symbol}` : '/openOrders';
    const response = await this.makeRequest('GET', endpoint, undefined, true);
    return response.data || [];
  }

  async placeOrder(order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: string;
    price?: string;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    clientOrderId?: string;
  }): Promise<BTCTurkOrder> {
    const response = await this.makeRequest('POST', '/order', order, true);
    return response.data;
  }

  async cancelOrder(symbol: string, orderId: string): Promise<{ orderId: string; status: string }> {
    const response = await this.makeRequest('DELETE', `/order?id=${orderId}&pairSymbol=${symbol}`, undefined, true);
    return response.data;
  }

  async getOrder(symbol: string, orderId: string): Promise<BTCTurkOrder> {
    const response = await this.makeRequest('GET', `/order?id=${orderId}&pairSymbol=${symbol}`, undefined, true);
    return response.data;
  }
}
