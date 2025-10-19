/**
 * BTCTurk WebSocket Client
 * Real-time ticker, trades, orderbook
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat monitoring (15s timeout)
 * - Sequence drift detection
 * - Jitter for reconnect delays
 */

import { EventEmitter } from 'events';

export interface WSConfig {
  url?: string;
  heartbeatInterval?: number;
  reconnectBackoff?: number[];
  maxReconnectDelay?: number;
}

const DEFAULT_CONFIG: Required<WSConfig> = {
  url: 'wss://ws-feed.btcturk.com',
  heartbeatInterval: 15000, // 15s
  reconnectBackoff: [1000, 2000, 4000, 8000, 16000],
  maxReconnectDelay: 16000,
};

export class BTCTurkWSClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WSConfig>;
  private reconnectAttempt: number = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastMessageTime: number = 0;
  private subscriptions: Set<string> = new Set();
  private lastSeq: number = 0;

  constructor(config: WSConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.emit('connected');
        this.reconnectAttempt = 0;
        this.startHeartbeat();
        this.resubscribe();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        this.emit('disconnected');
        this.stopHeartbeat();
        this.scheduleReconnect();
      };
    } catch (err) {
      this.emit('error', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel: string, symbols: string[]) {
    const sub = {
      type: 151, // Subscribe
      channel,
      event: symbols,
    };

    this.subscriptions.add(JSON.stringify(sub));

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify([sub]));
    }
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(raw: string) {
    this.lastMessageTime = Date.now();

    try {
      const messages = JSON.parse(raw);

      if (!Array.isArray(messages)) {
        return;
      }

      for (const msg of messages) {
        // Check sequence (drift detection)
        if (msg.seq && this.lastSeq > 0) {
          const expectedSeq = this.lastSeq + 1;
          if (msg.seq !== expectedSeq) {
            this.emit('drift', {
              expected: expectedSeq,
              received: msg.seq,
              gap: msg.seq - expectedSeq,
            });
            
            // Soft resubscribe on large gap
            if (Math.abs(msg.seq - expectedSeq) > 10) {
              this.resubscribe();
            }
          }
        }

        if (msg.seq) {
          this.lastSeq = msg.seq;
        }

        // Emit typed events
        if (msg.type === 421) {
          // Ticker
          this.emit('ticker', msg);
        } else if (msg.type === 422) {
          // Trade
          this.emit('trade', msg);
        } else if (msg.type === 431) {
          // Order book
          this.emit('orderbook', msg);
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastMessageTime = Date.now();

    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastMessageTime;

      if (elapsed > this.config.heartbeatInterval) {
        this.emit('heartbeat-timeout', elapsed);
        this.disconnect();
        this.connect();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnect with backoff + jitter
   */
  private scheduleReconnect() {
    const baseDelay = this.config.reconnectBackoff[
      Math.min(this.reconnectAttempt, this.config.reconnectBackoff.length - 1)
    ];

    // Add jitter (±20%)
    const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
    const delay = Math.min(baseDelay + jitter, this.config.maxReconnectDelay);

    this.emit('reconnecting', {
      attempt: this.reconnectAttempt + 1,
      delay,
    });

    setTimeout(() => {
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  /**
   * Resubscribe to all channels
   */
  private resubscribe() {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    const subs = Array.from(this.subscriptions).map(s => JSON.parse(s));
    
    if (subs.length > 0) {
      this.ws.send(JSON.stringify(subs));
    }
  }
}

