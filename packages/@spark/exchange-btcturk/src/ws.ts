// BTCTurk WebSocket Client
// WS client iskeleti (connect/reconnect/ping-pong, event emit)

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { BTCTurkConfig, BTCTurkEvent } from './index.js';

export class BTCTurkWS extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 250; // Start with 250ms
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isSubscribed = false;

  constructor(private config: BTCTurkConfig) {
    super();
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    const wsUrl = this.config.wsUrl || 'wss://ws-feed.btcturk.com';
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startPingPong();
        this.emit('connected');
        this.subscribe();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.emit('error', new Error(`Message parse error: ${error}`));
        }
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        this.stopPingPong();
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
      });

    } catch (error) {
      throw new Error(`BTCTurk WS connection error: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPingPong();
    this.isConnected = false;
  }

  private handleMessage(message: any): void {
    // TODO: Parse real BTCTurk message format
    const event: BTCTurkEvent = {
      ts: Date.now(),
      type: message.type || 'ticker',
      symbol: message.symbol || 'BTCUSDT',
      data: message
    };
    
    this.emit('event', event);
  }

  private startPingPong(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // 30 seconds
  }

  private stopPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    // TODO: Implement real BTCTurk subscription
    // For now, just send a hello message
    const subscribeMessage = {
      type: 'subscribe',
      channel: 'ticker',
      symbols: ['BTCUSDT']
    };
    
    this.ws.send(JSON.stringify(subscribeMessage));
    this.isSubscribed = true;
    this.emit('subscribed');
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnect attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff with jitter: 250ms -> 500ms -> 1s -> 2s -> 4s
    const baseDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    const delay = Math.min(baseDelay + jitter, 4000); // Max 4s
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }
}
