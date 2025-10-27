import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { BTCTurkConfig, BTCTurkWSMessage, BTCTurkTicker, BTCTurkTrade, BTCTurkOrderBook } from './types.js';

export class BTCTurkWSClient extends EventEmitter {
  private config: BTCTurkConfig;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private subscribedChannels = new Set<string>();

  constructor(config: BTCTurkConfig) {
    super();
    this.config = config;
    this.wsUrl = config.wsUrl || 'wss://ws-feed.btcturk.com';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.on('open', () => {
          console.log('BTCTurk WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message: BTCTurkWSMessage = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.ws.on('close', (code: number, reason: string) => {
          console.log(`BTCTurk WebSocket closed: ${code} ${reason}`);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code, reason });
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.ws.on('error', (error: Error) => {
          console.error('BTCTurk WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: BTCTurkWSMessage): void {
    this.emit('message', message);

    switch (message.type) {
      case 'ticker':
        this.emit('ticker', message.data as BTCTurkTicker);
        break;
      case 'trade':
        this.emit('trade', message.data as BTCTurkTrade);
        break;
      case 'orderbook':
        this.emit('orderbook', message.data as BTCTurkOrderBook);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Reconnecting to BTCTurk WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  subscribeTicker(symbol: string): void {
    const channel = `ticker_${symbol}`;
    this.subscribe(channel, { type: 'ticker', pairSymbol: symbol });
  }

  subscribeTrades(symbol: string): void {
    const channel = `trades_${symbol}`;
    this.subscribe(channel, { type: 'trades', pairSymbol: symbol });
  }

  subscribeOrderBook(symbol: string): void {
    const channel = `orderbook_${symbol}`;
    this.subscribe(channel, { type: 'orderbook', pairSymbol: symbol });
  }

  private subscribe(channel: string, message: any): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
      this.subscribedChannels.add(channel);
      console.log(`Subscribed to ${channel}`);
    }
  }

  unsubscribe(channel: string): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
      this.subscribedChannels.delete(channel);
      console.log(`Unsubscribed from ${channel}`);
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscribedChannels.clear();
  }

  getConnectionStatus(): { connected: boolean; channels: string[] } {
    return {
      connected: this.isConnected,
      channels: Array.from(this.subscribedChannels)
    };
  }
}
