/**
 * BTCTurk WebSocket & REST Client
 * Handles connections, reconnections, and data streaming
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import type { 
  BTCTurkConfig, 
  BTCTurkWSMessage,
  NormalizedTrade,
  OrderBookDelta,
  NormalizedTicker
} from './types';
import { BTCTurkAdapter } from './adapter';
import { 
  btcturkWsConnected,
  btcturkWsReconnectsTotal,
  btcturkWsMessagesTotal,
  btcturkLastMsgAgeSeconds,
  btcturkErrorsTotal,
  btcturkLatencyMs
} from './metrics';

export class BTCTurkClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: BTCTurkConfig;
  private adapter: BTCTurkAdapter;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastMessageTime = new Map<string, number>();

  constructor(config: BTCTurkConfig) {
    super();
    this.config = config;
    this.adapter = new BTCTurkAdapter();
  }

  /**
   * Connect to BTCTurk WebSocket
   */
  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket(this.config.wsUrl);
      
      this.ws.on('open', () => {
        console.log('BTCTurk WebSocket connected');
        this.reconnectAttempts = 0;
        this.config.symbols.forEach(symbol => {
          btcturkWsConnected.set({ symbol }, 1);
        });
        this.emit('connected');
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        console.log(`BTCTurk WebSocket closed: ${code} ${reason.toString()}`);
        this.config.symbols.forEach(symbol => {
          btcturkWsConnected.set({ symbol }, 0);
        });
        this.emit('disconnected', { code, reason: reason.toString() });
        this.scheduleReconnect();
      });

      this.ws.on('error', (error: Error) => {
        console.error('BTCTurk WebSocket error:', error);
        btcturkErrorsTotal.inc({ type: 'ws_error', symbol: 'all' });
        this.emit('error', error);
      });

    } catch (error) {
      btcturkErrorsTotal.inc({ type: 'connect_error', symbol: 'all' });
      throw error;
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: Buffer): void {
    try {
      const message: BTCTurkWSMessage = JSON.parse(data.toString());
      const now = Date.now();
      
      // Update metrics
      btcturkWsMessagesTotal.inc({ 
        channel: message.type, 
        symbol: message.symbol 
      });
      
      btcturkLastMsgAgeSeconds.set({ 
        channel: message.type, 
        symbol: message.symbol 
      }, 0);
      
      this.lastMessageTime.set(`${message.type}:${message.symbol}`, now);

      // Process and emit normalized data
      const normalized = this.adapter.processWSMessage(message);
      if (normalized) {
        this.emit('data', normalized);
      }

    } catch (error) {
      btcturkErrorsTotal.inc({ type: 'message_parse_error', symbol: 'unknown' });
      console.error('Failed to parse BTCTurk message:', error);
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      btcturkWsReconnectsTotal.inc({ 
        symbol: 'all', 
        reason: 'auto_reconnect' 
      });
      
      console.log(`Reconnecting to BTCTurk (attempt ${this.reconnectAttempts})...`);
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Subscribe to symbol channels
   */
  subscribe(symbol: string, channels: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const subscription = {
      type: 'subscribe',
      symbol,
      channels
    };

    this.ws.send(JSON.stringify(subscription));
  }

  /**
   * Unsubscribe from symbol channels
   */
  unsubscribe(symbol: string, channels: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const unsubscription = {
      type: 'unsubscribe',
      symbol,
      channels
    };

    this.ws.send(JSON.stringify(unsubscription));
  }

  /**
   * Get REST API data with latency tracking
   */
  async getRestData<T>(endpoint: string, method: string = 'GET'): Promise<T> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.config.restUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Record latency
      btcturkLatencyMs.observe({ endpoint, method }, Date.now() - start);
      
      return data as T;
    } catch (error) {
      btcturkErrorsTotal.inc({ type: 'rest_error', symbol: 'all' });
      throw error;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.config.symbols.forEach(symbol => {
      btcturkWsConnected.set({ symbol }, 0);
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get last message age for monitoring
   */
  getLastMessageAge(channel: string, symbol: string): number {
    const key = `${channel}:${symbol}`;
    const lastTime = this.lastMessageTime.get(key);
    return lastTime ? (Date.now() - lastTime) / 1000 : Infinity;
  }
}
