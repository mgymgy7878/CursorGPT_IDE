/**
 * BTCTurk WebSocket Client (Browser-compatible)
 * Real-time ticker, trades, orderbook
 */

type MessageCallback = (data: any) => void;

interface WSMetrics {
  reconnects: number;
  messages: number;
  lastMessageTime: number;
  errors: number;
}

export class BTCTurkWSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempt: number = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private subscriptions: Map<string, MessageCallback> = new Map();
  private lastSeq: number = 0;
  
  public metrics: WSMetrics = {
    reconnects: 0,
    messages: 0,
    lastMessageTime: 0,
    errors: 0,
  };

  constructor(url: string = 'wss://ws-feed-pro.btcturk.com') {
    this.url = url;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[BTCTurk WS] Connected');
        this.reconnectAttempt = 0;
        this.startHeartbeat();
        this.resubscribe();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[BTCTurk WS] Error:', error);
        this.metrics.errors++;
      };

      this.ws.onclose = () => {
        console.log('[BTCTurk WS] Disconnected');
        this.stopHeartbeat();
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('[BTCTurk WS] Connect error:', err);
      this.metrics.errors++;
      this.scheduleReconnect();
    }
  }

  subscribe(channel: string, symbols: string[], callback: MessageCallback) {
    const key = `${channel}:${symbols.join(',')}`;
    this.subscriptions.set(key, callback);

    if (this.ws?.readyState === WebSocket.OPEN) {
      const sub = {
        type: 151,
        channel,
        event: symbols,
      };
      this.ws.send(JSON.stringify([sub]));
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  getStaleness(): number {
    if (this.metrics.lastMessageTime === 0) return 999;
    return Math.floor((Date.now() - this.metrics.lastMessageTime) / 1000);
  }

  private handleMessage(raw: string) {
    this.metrics.lastMessageTime = Date.now();
    this.metrics.messages++;

    try {
      const messages = JSON.parse(raw);
      if (!Array.isArray(messages)) return;

      for (const msg of messages) {
        // Sequence drift check
        if (msg.seq && this.lastSeq > 0) {
          const gap = msg.seq - this.lastSeq - 1;
          if (gap > 0) {
            console.warn(`[BTCTurk WS] Sequence gap: ${gap}`);
            if (gap > 10) {
              this.resubscribe();
            }
          }
        }
        if (msg.seq) this.lastSeq = msg.seq;

        // Route to callbacks
        Array.from(this.subscriptions.entries()).forEach(([key, callback]) => {
          callback(msg);
        });
      }
    } catch (err) {
      console.error('[BTCTurk WS] Parse error:', err);
      this.metrics.errors++;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      const staleness = this.getStaleness();
      if (staleness > 15) {
        console.warn(`[BTCTurk WS] Heartbeat timeout: ${staleness}s`);
        this.disconnect();
        this.connect();
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    const backoff = [1000, 2000, 4000, 8000, 16000];
    const baseDelay = backoff[Math.min(this.reconnectAttempt, backoff.length - 1)];
    const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
    const delay = baseDelay + jitter;

    console.log(`[BTCTurk WS] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempt + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempt++;
      this.metrics.reconnects++;
      this.connect();
    }, delay);
  }

  private resubscribe() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const subs: any[] = [];
    Array.from(this.subscriptions.keys()).forEach(key => {
      const [channel, symbolsStr] = key.split(':');
      const symbols = symbolsStr.split(',');
      subs.push({ type: 151, channel, event: symbols });
    });

    if (subs.length > 0) {
      this.ws.send(JSON.stringify(subs));
    }
  }
}

// Global instance
let globalClient: BTCTurkWSClient | null = null;

export function getWSClient(): BTCTurkWSClient {
  if (!globalClient) {
    globalClient = new BTCTurkWSClient();
  }
  return globalClient;
}

