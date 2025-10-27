// BTCTurk REST Client
// REST client iskeleti (env-tabanlı konfig, no endpoints hardcode)

import axios, { AxiosInstance } from 'axios';
import { BTCTurkConfig } from './index.js';

export class BTCTurkREST {
  private client: AxiosInstance;

  constructor(private config: BTCTurkConfig & { pingPath?: string }) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.btcturk.com/api/v2',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Spark-Trading-Platform/1.0'
      }
    });

    // Auth headers if credentials provided
    if (config.apiKey && config.apiSecret) {
      this.client.defaults.headers.common['X-PCK'] = config.apiKey;
      this.client.defaults.headers.common['X-Stamp'] = Date.now().toString();
      // TODO: Add signature generation
    }
  }

  async getTicker(symbol?: string): Promise<any> {
    try {
      const response = await this.client.get('/ticker', {
        params: symbol ? { pairSymbol: symbol } : {}
      });
      return response.data;
    } catch (error) {
      throw new Error(`BTCTurk REST error: ${error}`);
    }
  }

  async getOrderBook(symbol: string): Promise<any> {
    try {
      const response = await this.client.get('/orderbook', {
        params: { pairSymbol: symbol }
      });
      return response.data;
    } catch (error) {
      throw new Error(`BTCTurk REST error: ${error}`);
    }
  }

  async getTrades(symbol: string, limit = 50): Promise<any> {
    try {
      const response = await this.client.get('/trades', {
        params: { pairSymbol: symbol, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`BTCTurk REST error: ${error}`);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const pingPath = this.config.pingPath || '/ping';
      await this.client.head(pingPath);
      return true;
    } catch (error) {
      console.warn(`BTCTurk ping failed: ${error}`);
      return false;
    }
  }

  async serverTime(): Promise<number | null> {
    try {
      const response = await this.client.get('/server/time');
      return response.data.serverTime || Date.now();
    } catch (error) {
      console.warn(`BTCTurk serverTime failed: ${error}`);
      return null;
    }
  }
}
