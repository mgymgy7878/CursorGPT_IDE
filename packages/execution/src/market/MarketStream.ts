import WebSocket from "ws";
import { EventEmitter } from "events";
import type { ExchangeConfig } from "../config/exchange";

export interface MarketTickerEvent {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface MarketTradeEvent {
  symbol: string;
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface MarketEvent {
  type: 'ticker' | 'trade' | 'kline' | 'depth';
  symbol: string;
  data: MarketTickerEvent | MarketTradeEvent | any;
  timestamp: Date;
}

export class BinanceMarketStream extends EventEmitter {
  private config: ExchangeConfig;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private throttleInterval: NodeJS.Timeout | null = null;
  private lastEmitTime: number = 0;
  private throttleDelay: number = 100; // 100ms throttle

  constructor(config: ExchangeConfig) {
    super();
    this.config = config;
  }

  async start(symbols: string[] = ['btcusdt']): Promise<void> {
    try {
      await this.connectWebSocket(symbols);
      console.log('Market Stream başlatıldı');
    } catch (error) {
      console.error('Market Stream başlatma hatası:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.disconnectWebSocket();
    console.log('Market Stream durduruldu');
  }

  async subscribe(symbols: string[]): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket bağlantısı yok');
    }

    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: symbols.map(symbol => `${symbol}@ticker`),
      id: Date.now()
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    console.log('Market Stream abonelikleri:', Array.from(this.subscribedSymbols));
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    if (!this.isConnected || !this.ws) {
      return;
    }

    const unsubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params: symbols.map(symbol => `${symbol}@ticker`),
      id: Date.now()
    };

    this.ws.send(JSON.stringify(unsubscribeMessage));
    
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
    console.log('Market Stream abonelikleri:', Array.from(this.subscribedSymbols));
  }

  private async connectWebSocket(symbols: string[]): Promise<void> {
    const wsUrl = this.config.mode.includes('spot') 
      ? 'wss://testnet.binance.vision/ws'
      : 'wss://stream.binancefuture.com/ws';

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('Market WebSocket bağlandı');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Subscribe to symbols
      this.subscribe(symbols);
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Market WebSocket mesaj parse hatası:', error);
      }
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`Market WebSocket kapandı: ${code} - ${reason.toString()}`);
      this.isConnected = false;
      this.emit('disconnected', { code, reason: reason.toString() });
      this.scheduleReconnect(symbols);
    });

    this.ws.on('error', (error: Error) => {
      console.error('Market WebSocket hatası:', error);
      this.emit('error', error);
    });
  }

  private handleMessage(message: any): void {
    // Handle subscription responses
    if (message.result !== undefined) {
      console.log('Market Stream subscription response:', message);
      return;
    }

    // Handle error responses
    if (message.error) {
      console.error('Market Stream error:', message.error);
      return;
    }

    // Handle market data
    if (message.s && message.e) {
      const event: MarketEvent = {
        type: this.getEventType(message.e),
        symbol: message.s,
        data: message,
        timestamp: new Date(message.E || Date.now())
      };

      // Throttle emissions
      this.throttledEmit(event);
    }
  }

  private getEventType(eventType: string): 'ticker' | 'trade' | 'kline' | 'depth' {
    switch (eventType) {
      case '24hrTicker':
        return 'ticker';
      case 'trade':
        return 'trade';
      case 'kline':
        return 'kline';
      case 'depthUpdate':
        return 'depth';
      default:
        return 'ticker';
    }
  }

  private throttledEmit(event: MarketEvent): void {
    const now = Date.now();
    
    if (now - this.lastEmitTime >= this.throttleDelay) {
      this.emit('marketData', event);
      this.lastEmitTime = now;
    } else {
      // Queue for later emission
      if (this.throttleInterval) {
        clearTimeout(this.throttleInterval);
      }
      
      this.throttleInterval = setTimeout(() => {
        this.emit('marketData', event);
        this.lastEmitTime = Date.now();
      }, this.throttleDelay - (now - this.lastEmitTime));
    }
  }

  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    
    if (this.throttleInterval) {
      clearTimeout(this.throttleInterval);
      this.throttleInterval = null;
    }
  }

  private scheduleReconnect(symbols: string[]): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Market Stream: Maksimum yeniden bağlanma denemesi aşıldı');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.reconnectInterval = setTimeout(async () => {
      console.log(`Market Stream yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      try {
        await this.connectWebSocket(symbols);
      } catch (error) {
        console.error('Market Stream yeniden bağlanma hatası:', error);
        this.scheduleReconnect(symbols);
      }
    }, delay);
  }

  isStreamConnected(): boolean {
    return this.isConnected;
  }

  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }
} 