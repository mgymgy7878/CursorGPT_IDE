import WebSocket from "ws";
import { StreamConnector, StreamEvent } from "../types";
import { createHash } from "crypto";

export class BinanceConnector implements StreamConnector {
  name = 'binance';
  private ws: WebSocket | null = null;
  private lastHeartbeat = Date.now();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade/btcusdt@kline_1m');
      
      this.ws.on('open', () => {
        console.log('Binance WebSocket connected');
        this.reconnectAttempts = 0;
        this.lastHeartbeat = Date.now();
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        console.error('Binance WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Binance WebSocket disconnected');
        this.handleReconnect();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getLastHeartbeat(): number {
    return this.lastHeartbeat;
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      this.lastHeartbeat = Date.now();
      
      // Generate synthetic event
      const event: StreamEvent = {
        id: `binance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tsSource: message.E || Date.now(),
        tsIngest: Date.now(),
        src: 'binance',
        symbol: 'BTCUSDT',
        seq: message.s || Math.floor(Math.random() * 1000000),
        type: message.e === 'trade' ? 'trade' : 'kline',
        payload: message,
        payloadHash: createHash('sha256').update(JSON.stringify(message)).digest('hex')
      };

      // Emit event (would be handled by event emitter in real implementation)
      console.log(`Binance event: ${event.type} for ${event.symbol}`);
    } catch (error) {
      console.error('Error parsing Binance message:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to Binance (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached for Binance');
    }
  }
} 