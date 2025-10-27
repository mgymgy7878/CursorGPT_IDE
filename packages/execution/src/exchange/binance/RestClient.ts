import crypto from "crypto";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { getBinanceEndpoints } from "../../config/exchange";
import type { ExchangeConfig, BinanceEndpoints } from "../../config/exchange";

export interface BinanceOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  newClientOrderId?: string;
  stopPrice?: string;
  icebergQty?: string;
  newOrderRespType?: 'ACK' | 'RESULT' | 'FULL';
}

export interface BinanceOrderResponse {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  fills?: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

export interface BinanceAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

export class BinanceRestClient {
  private config: ExchangeConfig;
  private endpoints: BinanceEndpoints;
  private client: AxiosInstance;
  private serverTimeOffset: number = 0;

  constructor(config: ExchangeConfig) {
    this.config = config;
    this.endpoints = getBinanceEndpoints(config.mode);
    this.client = axios.create({
      baseURL: this.endpoints.rest.base,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-MBX-APIKEY': config.apiKey
      }
    });
  }

  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  private async getServerTime(): Promise<number> {
    try {
      const response = await this.client.get('/api/v3/time');
      return response.data.serverTime;
    } catch (error) {
      console.error('Server time fetch error:', error);
      return Date.now();
    }
  }

  private async syncTimestamp(): Promise<void> {
    const serverTime = await this.getServerTime();
    const localTime = Date.now();
    this.serverTimeOffset = serverTime - localTime;
    console.log(`Timestamp drift: ${this.serverTimeOffset}ms`);
  }

  private getTimestamp(): number {
    return Date.now() + this.serverTimeOffset;
  }

  private async makeSignedRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    // Sync timestamp if needed
    if (Math.abs(this.serverTimeOffset) > 5000) {
      await this.syncTimestamp();
    }

    const timestamp = this.getTimestamp();
    const queryParams = {
      ...params,
      timestamp: timestamp.toString(),
      recvWindow: this.config.recvWindow.toString()
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = this.createSignature(queryString);
    const url = `${endpoint}?${queryString}&signature=${signature}`;

    try {
      let response;
      if (method === 'GET') {
        response = await this.client.get(url);
      } else if (method === 'POST') {
        response = await this.client.post(url);
      } else if (method === 'DELETE') {
        response = await this.client.delete(url);
      }

      return response!.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || error.message;
      console.error(`Binance API Error (${method} ${endpoint}):`, errorMsg);
      throw new Error(`Binance API Error: ${errorMsg}`);
    }
  }

  async placeOrder(params: BinanceOrderParams): Promise<BinanceOrderResponse> {
    const endpoint = this.endpoints.rest.order;
    return this.makeSignedRequest('POST', endpoint, params);
  }

  async getOrderStatus(symbol: string, orderId: number): Promise<BinanceOrderResponse> {
    const endpoint = this.endpoints.rest.order;
    return this.makeSignedRequest('GET', endpoint, { symbol, orderId });
  }

  async cancelOrder(symbol: string, orderId: number): Promise<BinanceOrderResponse> {
    const endpoint = this.endpoints.rest.order;
    return this.makeSignedRequest('DELETE', endpoint, { symbol, orderId });
  }

  async getAccountInfo(): Promise<BinanceAccountInfo> {
    const endpoint = this.endpoints.rest.account;
    return this.makeSignedRequest('GET', endpoint);
  }

  async getUserDataStream(): Promise<{ listenKey: string }> {
    const endpoint = this.endpoints.rest.userDataStream;
    return this.makeSignedRequest('POST', endpoint);
  }

  async keepAliveUserDataStream(listenKey: string): Promise<{}> {
    const endpoint = this.endpoints.rest.userDataStream;
    return this.makeSignedRequest('POST', endpoint, { listenKey });
  }

  async closeUserDataStream(listenKey: string): Promise<{}> {
    const endpoint = this.endpoints.rest.userDataStream;
    return this.makeSignedRequest('DELETE', endpoint, { listenKey });
  }
} 