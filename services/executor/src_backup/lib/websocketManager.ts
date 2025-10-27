import WebSocket from "ws";
import { EventEmitter } from "events";

export interface WebSocketMessage {
  stream: string;
  data: any;
}

export interface OrderUpdate {
  symbol: string;
  orderId: string;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice?: string;
  icebergQty?: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty?: string;
}

export interface AccountUpdate {
  eventType: string;
  eventTime: number;
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

export class WebSocketManager extends EventEmitter {
  private ws: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(baseUrl: string, apiKey: string, apiSecret: string) {
    super();
    this.baseUrl = baseUrl.replace('https://', 'wss://');
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async connect(): Promise<void> {
    try {
      const listenKey = await this.getListenKey();
      const wsUrl = `${this.baseUrl}/ws/${listenKey}`;
      
      // WebSocket compression options
      const compress = process.env.WS_COMPRESS === "true";
      const level = Number(process.env.WS_DEFLATE_LEVEL || 3);
      
      const wsOptions = compress ? {
        perMessageDeflate: { zlibDeflateOptions: { level } }
      } : {};
      
      this.ws = new WebSocket(wsUrl, wsOptions);
      
      this.ws.on('open', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.emit('connected');
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.stopPingInterval();
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  private async getListenKey(): Promise<string> {
    const response = await fetch(`${this.baseUrl.replace('wss://', 'https://')}/api/v3/userDataStream`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get listen key: ${response.status}`);
    }

    const data = await response.json();
    return data.listenKey;
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.stream) {
      case '!userData':
        this.handleUserData(message.data);
        break;
      default:
        console.log('Unknown stream:', message.stream);
    }
  }

  private handleUserData(data: any): void {
    if (data.e === 'outboundAccountPosition') {
      const accountUpdate: AccountUpdate = {
        eventType: data.e,
        eventTime: data.E,
        balances: data.B.map((b: any) => ({
          asset: b.a,
          free: b.f,
          locked: b.l
        }))
      };
      this.emit('accountUpdate', accountUpdate);
    } else if (data.e === 'executionReport') {
      const orderUpdate: OrderUpdate = {
        symbol: data.s,
        orderId: data.i,
        clientOrderId: data.c,
        price: data.p,
        origQty: data.q,
        executedQty: data.z,
        cummulativeQuoteQty: data.Z,
        status: data.X,
        timeInForce: data.f,
        type: data.o,
        side: data.S,
        stopPrice: data.P,
        icebergQty: data.F,
        time: data.T,
        updateTime: data.t,
        isWorking: data.w,
        origQuoteOrderQty: data.Q
      };
      this.emit('orderUpdate', orderUpdate);
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.stopPingInterval();
  }

  isConnectedToWebSocket(): boolean {
    return this.isConnected;
  }
} 