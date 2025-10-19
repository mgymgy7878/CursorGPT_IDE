import WebSocket from 'ws';

interface BTCTurkMessage {
  type: number;
  channel: string;
  event: any;
  join?: boolean;
}

interface ReconnectConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

export class BTCTurkWSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectConfig: ReconnectConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, (data: any) => void> = new Map();
  private isConnecting = false;

  constructor(url = 'wss://ws-feed-pro.btcturk.com/', config?: Partial<ReconnectConfig>) {
    this.url = url;
    this.reconnectConfig = {
      maxRetries: 10,
      baseDelay: 1000,
      maxDelay: 30000,
      jitter: true,
      ...config
    };
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('✅ BTCTurk WS connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.resubscribe();
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as BTCTurkMessage;
        this.handleMessage(msg);
      } catch (err) {
        console.error('❌ BTCTurk WS parse error:', err);
      }
    });

    this.ws.on('error', (err) => {
      console.error('❌ BTCTurk WS error:', err);
    });

    this.ws.on('close', () => {
      console.warn('⚠️ BTCTurk WS closed');
      this.isConnecting = false;
      this.stopHeartbeat();
      this.scheduleReconnect();
    });
  }

  private handleMessage(msg: BTCTurkMessage): void {
    // Route message to subscribers based on channel
    const key = `${msg.channel}`;
    const callback = this.subscriptions.get(key);
    if (callback) {
      callback(msg.event);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.reconnectConfig.maxRetries) {
      console.error('❌ BTCTurk WS max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    let delay = Math.min(
      this.reconnectConfig.baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.reconnectConfig.maxDelay
    );

    // Add jitter (±20%)
    if (this.reconnectConfig.jitter) {
      const jitterRange = delay * 0.2;
      delay += Math.random() * jitterRange * 2 - jitterRange;
    }

    console.log(`🔄 BTCTurk WS reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.reconnectConfig.maxRetries})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // BTCTurk uses ping frame (WebSocket protocol level)
        this.ws.ping();
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private resubscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Resubscribe to all channels
    for (const [key] of Array.from(this.subscriptions.entries())) {
      const channel = key;
      const subscribeMsg: BTCTurkMessage = {
        type: 151, // Subscribe message type
        channel,
        event: [],
        join: true
      };
      this.ws.send(JSON.stringify(subscribeMsg));
    }
  }

  subscribe(channel: string, callback: (data: any) => void): void {
    this.subscriptions.set(channel, callback);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscribeMsg: BTCTurkMessage = {
        type: 151,
        channel,
        event: [],
        join: true
      };
      this.ws.send(JSON.stringify(subscribeMsg));
    }
  }

  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscribeMsg: BTCTurkMessage = {
        type: 151,
        channel,
        event: [],
        join: false
      };
      this.ws.send(JSON.stringify(unsubscribeMsg));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Example usage
export function createBTCTurkClient(): BTCTurkWSClient {
  const client = new BTCTurkWSClient();
  
  // Subscribe to ticker
  client.subscribe('ticker', (data) => {
    console.log('📊 Ticker update:', data);
  });

  // Subscribe to orderbook
  client.subscribe('orderbook', (data) => {
    console.log('📖 Orderbook update:', data);
  });

  // Subscribe to trades
  client.subscribe('trade', (data) => {
    console.log('💱 Trade update:', data);
  });

  client.connect();
  
  return client;
}

