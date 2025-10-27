// services/executor/src/connectors/binance-futures-ws.ts
import WebSocket from "ws";

const HEARTBEAT_MS = 25_000;
const LISTENKEY_RENEW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Binance Futures WebSocket Connector
 * Supports both market data and user data streams
 */
export class BinanceFuturesWS {
  private ws?: WebSocket;
  private heartbeatTimer?: NodeJS.Timeout;
  private renewTimer?: NodeJS.Timeout;
  private listenKey?: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(
    private readonly apiKey?: string,
    private readonly testnet: boolean = true
  ) {
    console.log(`[BinanceFuturesWS] Initialized ${testnet ? 'TESTNET' : 'PRODUCTION'} mode`);
  }

  /**
   * Get base URL for REST API
   */
  private getBaseUrl(): string {
    return this.testnet
      ? "https://testnet.binancefuture.com"
      : "https://fapi.binance.com";
  }

  /**
   * Get base URL for WebSocket streams
   */
  private getStreamBase(): string {
    return this.testnet
      ? "wss://stream.binancefuture.com"
      : "wss://fstream.binance.com";
  }

  /**
   * Get listen key for user data stream
   */
  async getListenKey(): Promise<string> {
    const url = `${this.getBaseUrl()}/fapi/v1/listenKey`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-MBX-APIKEY": this.apiKey || "",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to get listen key: ${JSON.stringify(data)}`);
    }

    return data.listenKey as string;
  }

  /**
   * Renew listen key to keep it alive
   */
  async renewListenKey(key: string): Promise<void> {
    const url = `${this.getBaseUrl()}/fapi/v1/listenKey`;
    await fetch(url, {
      method: "PUT",
      headers: {
        "X-MBX-APIKEY": this.apiKey || "",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ listenKey: key }).toString(),
    });

    console.log(`[BinanceFuturesWS] Listen key renewed: ${key.substring(0, 8)}...`);
  }

  /**
   * Connect to user data stream (positions, orders, balances)
   */
  async connectUserData(onMessage: (msg: any) => void): Promise<void> {
    try {
      this.listenKey = await this.getListenKey();
      const url = `${this.getStreamBase()}/ws/${this.listenKey}`;

      console.log(`[BinanceFuturesWS] Connecting to user data stream...`);
      await this.connect(url, onMessage, 'userData');

      // Auto-renew listen key every 30 minutes
      this.renewTimer = setInterval(() => {
        if (this.listenKey) {
          this.renewListenKey(this.listenKey).catch((err) => {
            console.error('[BinanceFuturesWS] Listen key renewal failed:', err);
          });
        }
      }, LISTENKEY_RENEW_MS);

      console.log(`[BinanceFuturesWS] User data stream connected`);
    } catch (err) {
      console.error('[BinanceFuturesWS] User data connection failed:', err);
      throw err;
    }
  }

  /**
   * Connect to market data streams (trades, depth, ticker)
   */
  async connectMarketStreams(
    symbols: string[],
    onMessage: (msg: any) => void
  ): Promise<void> {
    const lowerSymbols = symbols.map((s) => s.toLowerCase());

    // Build stream names
    const streams = [
      ...lowerSymbols.map((s) => `${s}@trade`), // Trade streams
      ...lowerSymbols.map((s) => `${s}@depth5@100ms`), // Depth 5 levels @100ms
      ...lowerSymbols.map((s) => `${s}@ticker`), // 24hr ticker
    ].join("/");

    const url = `${this.getStreamBase()}/stream?streams=${streams}`;

    console.log(`[BinanceFuturesWS] Connecting to market streams: ${symbols.join(', ')}`);
    await this.connect(url, onMessage, 'market');
    console.log(`[BinanceFuturesWS] Market streams connected`);
  }

  /**
   * Internal connect method
   */
  private async connect(
    url: string,
    onMessage: (msg: any) => void,
    streamType: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        console.log(`[BinanceFuturesWS] ${streamType} connection opened`);
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on("message", (buffer) => {
        try {
          const message = JSON.parse(buffer.toString());
          onMessage(message);
        } catch (err) {
          console.error('[BinanceFuturesWS] Message parse error:', err);
        }
      });

      this.ws.on("close", (code, reason) => {
        const duration = (Date.now() - startTime) / 1000;
        console.log(
          `[BinanceFuturesWS] ${streamType} connection closed after ${duration}s (code: ${code})`
        );

        // Clear heartbeat timer
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
        }

        // Attempt reconnection
        this.reconnect(url, onMessage, streamType);
      });

      this.ws.on("error", (err) => {
        console.error(`[BinanceFuturesWS] ${streamType} error:`, err.message);
        reject(err);
      });

      this.ws.on("ping", () => {
        this.ws?.pong();
      });

      // Setup heartbeat
      this.heartbeatTimer = setInterval(() => {
        this.ping();
      }, HEARTBEAT_MS);
    });
  }

  /**
   * Send ping to keep connection alive
   */
  private ping(): void {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    } catch (err) {
      // Ignore ping errors
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(
    url: string,
    onMessage: (msg: any) => void,
    streamType: string
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `[BinanceFuturesWS] Max reconnect attempts (${this.maxReconnectAttempts}) reached for ${streamType}`
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(
      `[BinanceFuturesWS] Reconnecting ${streamType} in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(url, onMessage, streamType).catch((err) => {
        console.error(`[BinanceFuturesWS] Reconnect failed for ${streamType}:`, err);
      });
    }, delay);
  }

  /**
   * Stop all connections
   */
  stop(): void {
    console.log('[BinanceFuturesWS] Stopping WebSocket connections...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.renewTimer) {
      clearInterval(this.renewTimer);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    console.log('[BinanceFuturesWS] WebSocket connections stopped');
  }
}

