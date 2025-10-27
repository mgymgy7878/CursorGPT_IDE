import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { prometheus } from './metrics.js';

export class WSClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectInterval: number;
  private backpressureLimit: number;
  private clockDriftThreshold: number;
  private exchange: string;
  private channel: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: any[] = [];
  private lastSequence = 0;

  constructor(
    exchange: string,
    channel: string,
    options: {
      reconnectInterval?: number;
      backpressureLimit?: number;
      clockDriftThreshold?: number;
    } = {}
  ) {
    super();
    this.exchange = exchange;
    this.channel = channel;
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.backpressureLimit = options.backpressureLimit || 1000;
    this.clockDriftThreshold = options.clockDriftThreshold || 1000;
  }

  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.on('open', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      prometheus.wsConn.set({ exchange: this.exchange }, 1);
      this.emit('connected');
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        this.emit('error', error);
      }
    });

    this.ws.on('close', () => {
      this.isConnected = false;
      prometheus.wsConn.set({ exchange: this.exchange }, 0);
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
      prometheus.wsReconnects.inc({ exchange: this.exchange, reason: 'error' });
    });
  }

  private handleMessage(message: any) {
    // Check for sequence gaps
    if (message.seq && message.seq !== this.lastSequence + 1) {
      const gap = message.seq - this.lastSequence - 1;
      prometheus.wsSeqGap.inc({ exchange: this.exchange, channel: this.channel }, gap);
    }
    this.lastSequence = message.seq || this.lastSequence;

    // Check for clock drift
    const now = Date.now();
    const messageTime = message.timestamp || now;
    const drift = Math.abs(now - messageTime);
    
    if (drift > this.clockDriftThreshold) {
      prometheus.wsGap.observe({ exchange: this.exchange, channel: this.channel }, drift);
    }

    // Handle backpressure
    if (this.messageQueue.length >= this.backpressureLimit) {
      // Drop oldest message
      this.messageQueue.shift();
    }
    
    this.messageQueue.push(message);
    prometheus.wsMsgs.inc({ exchange: this.exchange, channel: this.channel });
    
    this.emit('message', message);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const jitter = Math.random() * 1000;
    const delay = this.reconnectInterval + jitter;
    
    setTimeout(() => {
      this.reconnectAttempts++;
      prometheus.wsReconnects.inc({ exchange: this.exchange, reason: 'reconnect' });
      this.connect(this.ws?.url || '');
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
