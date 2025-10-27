import axios, { type AxiosInstance } from "axios";
import crypto from "crypto";
import type { Symbol, Price, Quantity, OrderId } from "@spark/types";
import { asSymbol, asPrice, asQuantity, asOrderId } from "@spark/types";
import { mapToBTCTurk, autoRoundOrder } from "./validators.js";

export interface BTCTurkConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  recvWindow: number;
}

export interface BTCTurkOrderParams {
  symbol: Symbol;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: Quantity;
  price?: Price;
}

export interface BTCTurkOrderResponse {
  orderId: OrderId;
  symbol: Symbol;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: Quantity;
  price?: Price;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  timestamp: number;
}

export class BTCTurkRestClient {
  private client: AxiosInstance;
  private config: BTCTurkConfig;

  constructor(config: BTCTurkConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
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

  private async makeSignedRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const timestamp = Date.now();
    const queryParams = {
      ...params,
      timestamp: timestamp.toString(),
      recvWindow: this.config.recvWindow.toString()
    };
    
    const queryString = new URLSearchParams(queryParams).toString();
    const signature = this.createSignature(queryString);
    const url = `${endpoint}?${queryString}&signature=${signature}`;

    const response = await this.client.request({
      method,
      url,
      data: method === 'POST' ? params : undefined
    });

    return response.data;
  }

  async placeOrder(params: BTCTurkOrderParams): Promise<BTCTurkOrderResponse> {
    const btcturkSymbol = mapToBTCTurk(params.symbol);
    
    // Auto-round order parameters
    const rounded = autoRoundOrder(
      params.price || 0,
      params.quantity,
      btcturkSymbol
    );

    if (!rounded.isValid) {
      throw new Error(`Order validation failed for ${btcturkSymbol}`);
    }

    const orderParams = {
      symbol: btcturkSymbol,
      side: params.side,
      type: params.type,
      quantity: rounded.quantity,
      ...(params.price && { price: rounded.price })
    };

    const response = await this.makeSignedRequest('POST', '/api/v1/order', orderParams);

    return {
      orderId: asOrderId(response.orderId),
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      quantity: rounded.quantity,
      price: params.price ? rounded.price : undefined,
      status: 'PENDING',
      timestamp: Date.now()
    };
  }

  async getOrderStatus(orderId: OrderId): Promise<BTCTurkOrderResponse> {
    const response = await this.makeSignedRequest('GET', '/api/v1/order', {
      orderId: orderId
    });

    return {
      orderId: asOrderId(response.orderId),
      symbol: asSymbol(response.symbol),
      side: response.side,
      type: response.type,
      quantity: asQuantity(response.quantity),
      price: response.price ? asPrice(response.price) : undefined,
      status: response.status,
      timestamp: response.timestamp
    };
  }

  async cancelOrder(orderId: OrderId): Promise<boolean> {
    try {
      await this.makeSignedRequest('DELETE', '/api/v1/order', {
        orderId: orderId
      });
      return true;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  }

  async getAccountInfo(): Promise<any> {
    return this.makeSignedRequest('GET', '/api/v1/account');
  }

  async getSymbolInfo(symbol: Symbol): Promise<any> {
    const btcturkSymbol = mapToBTCTurk(symbol);
    return this.makeSignedRequest('GET', '/api/v1/exchangeInfo', {
      symbol: btcturkSymbol
    });
  }
} 