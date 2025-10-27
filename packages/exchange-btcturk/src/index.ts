export * from './types.js';
export * from './rest-client.js';
export * from './ws-client.js';

import { BTCTurkRESTClient } from './rest-client.js';
import { BTCTurkWSClient } from './ws-client.js';
import { BTCTurkConfig, BTCTurkMetrics } from './types.js';

export class BTCTurkExchange {
  private restClient: BTCTurkRESTClient;
  private wsClient: BTCTurkWSClient;
  private metrics: BTCTurkMetrics;

  constructor(config: BTCTurkConfig) {
    this.restClient = new BTCTurkRESTClient(config);
    this.wsClient = new BTCTurkWSClient(config);
    this.metrics = {
      httpRequestsTotal: 0,
      wsMessagesTotal: 0,
      wsDisconnectsTotal: 0,
      clockSkewSeconds: 0,
      lastUpdate: Date.now()
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wsClient.on('message', () => {
      this.metrics.wsMessagesTotal++;
      this.metrics.lastUpdate = Date.now();
    });

    this.wsClient.on('disconnected', () => {
      this.metrics.wsDisconnectsTotal++;
    });

    // Update clock skew periodically
    setInterval(async () => {
      try {
        const serverTime = await this.restClient.getServerTime();
        const localTime = Date.now();
        this.metrics.clockSkewSeconds = (serverTime - localTime) / 1000;
      } catch (error) {
        console.error('Failed to update clock skew:', error);
      }
    }, 60000); // Every minute
  }

  // REST API methods
  async getServerTime(): Promise<number> {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getServerTime();
  }

  async getSymbols() {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getSymbols();
  }

  async getTicker(symbol?: string) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getTicker(symbol);
  }

  async getTrades(symbol: string, limit?: number) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getTrades(symbol, limit);
  }

  async getOrderBook(symbol: string, limit?: number) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getOrderBook(symbol, limit);
  }

  async getKlines(symbol: string, interval?: string, startTime?: number, endTime?: number, limit?: number) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getKlines(symbol, interval, startTime, endTime, limit);
  }

  async getAccount() {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getAccount();
  }

  async getOpenOrders(symbol?: string) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getOpenOrders(symbol);
  }

  async placeOrder(order: any) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.placeOrder(order);
  }

  async cancelOrder(symbol: string, orderId: string) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.cancelOrder(symbol, orderId);
  }

  async getOrder(symbol: string, orderId: string) {
    this.metrics.httpRequestsTotal++;
    return this.restClient.getOrder(symbol, orderId);
  }

  // WebSocket methods
  async connectWS(): Promise<void> {
    return this.wsClient.connect();
  }

  subscribeTicker(symbol: string): void {
    this.wsClient.subscribeTicker(symbol);
  }

  subscribeTrades(symbol: string): void {
    this.wsClient.subscribeTrades(symbol);
  }

  subscribeOrderBook(symbol: string): void {
    this.wsClient.subscribeOrderBook(symbol);
  }

  unsubscribe(channel: string): void {
    this.wsClient.unsubscribe(channel);
  }

  disconnectWS(): void {
    this.wsClient.disconnect();
  }

  getWSStatus() {
    return this.wsClient.getConnectionStatus();
  }

  // Event handling
  on(event: string, listener: (...args: any[]) => void): this {
    this.wsClient.on(event, listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.wsClient.off(event, listener);
    return this;
  }

  // Metrics
  getMetrics(): BTCTurkMetrics {
    return { ...this.metrics };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; metrics: BTCTurkMetrics; wsStatus: any }> {
    try {
      const serverTime = await this.getServerTime();
      const wsStatus = this.getWSStatus();
      
      return {
        status: 'healthy',
        metrics: this.getMetrics(),
        wsStatus
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: this.getMetrics(),
        wsStatus: this.getWSStatus()
      };
    }
  }
}