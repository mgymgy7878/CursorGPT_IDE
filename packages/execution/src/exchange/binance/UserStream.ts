import WebSocket from "ws";
import { EventEmitter } from "events";
import { BinanceRestClient } from "./RestClient";
import type { ExchangeConfig } from "../../config/exchange";

export interface UserDataEvent {
  type: 'executionReport' | 'outboundAccountPosition' | 'balanceUpdate';
  data: any;
  timestamp: Date;
}

export interface ExecutionReportEvent {
  symbol: string;
  clientOrderId: string;
  orderId: number;
  orderListId: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  isWorking: boolean;
  orderCreationTime: number;
  cummulativeQuoteQtyTransacted: string;
  lastQuoteTransacted: string;
  lastQuoteQty: string;
  lastQty: string;
  lastPrice: string;
  quoteQty: string;
  quoteQtyTransacted: string;
  eventTime: number;
  eventType: string;
  isReduceOnly: boolean;
  isClosePosition: boolean;
  activationPrice: string;
  callbackRate: string;
  realizedProfit: string;
  fills?: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

export class BinanceUserStream extends EventEmitter {
  private config: ExchangeConfig;
  private restClient: BinanceRestClient;
  private ws: WebSocket | null = null;
  private listenKey: string | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;

  constructor(config: ExchangeConfig, restClient: BinanceRestClient) {
    super();
    this.config = config;
    this.restClient = restClient;
  }

  async start(): Promise<void> {
    try {
      await this.getListenKey();
      await this.connectWebSocket();
      this.startKeepAlive();
      console.log('User Data Stream başlatıldı');
    } catch (error) {
      console.error('User Data Stream başlatma hatası:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.stopKeepAlive();
    this.disconnectWebSocket();
    if (this.listenKey) {
      try {
        await this.restClient.closeUserDataStream(this.listenKey);
        console.log('User Data Stream durduruldu');
      } catch (error) {
        console.error('ListenKey kapatma hatası:', error);
      }
    }
  }

  private async getListenKey(): Promise<void> {
    try {
      const response = await this.restClient.getUserDataStream();
      this.listenKey = response.listenKey;
      console.log('ListenKey alındı:', this.listenKey);
    } catch (error) {
      console.error('ListenKey alma hatası:', error);
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.listenKey) {
      throw new Error('ListenKey bulunamadı');
    }

    const wsUrl = this.config.mode.includes('spot') 
      ? `wss://testnet.binance.vision/ws/${this.listenKey}`
      : `wss://stream.binancefuture.com/ws/${this.listenKey}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('User Data WebSocket bağlandı');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('WebSocket mesaj parse hatası:', error);
      }
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`WebSocket kapandı: ${code} - ${reason.toString()}`);
      this.isConnected = false;
      this.emit('disconnected', { code, reason: reason.toString() });
      this.scheduleReconnect();
    });

    this.ws.on('error', (error: Error) => {
      console.error('WebSocket hatası:', error);
      this.emit('error', error);
    });
  }

  private handleMessage(message: any): void {
    const event: UserDataEvent = {
      type: message.e,
      data: message,
      timestamp: new Date(message.E || Date.now())
    };

    this.emit('message', event);

    // Specific event handling
    if (message.e === 'executionReport') {
      const executionReport: ExecutionReportEvent = message;
      this.emit('executionReport', executionReport);
      
      // Map to internal events
      switch (executionReport.status) {
        case 'NEW':
          this.emit('execution:placed', {
            executionId: executionReport.clientOrderId,
            orderId: executionReport.orderId.toString(),
            status: 'placed',
            data: executionReport
          });
          break;
        case 'FILLED':
          this.emit('execution:filled', {
            executionId: executionReport.clientOrderId,
            orderId: executionReport.orderId.toString(),
            status: 'filled',
            data: executionReport
          });
          break;
        case 'CANCELED':
          this.emit('execution:cancelled', {
            executionId: executionReport.clientOrderId,
            orderId: executionReport.orderId.toString(),
            status: 'cancelled',
            data: executionReport
          });
          break;
        case 'PARTIALLY_FILLED':
          this.emit('execution:partial', {
            executionId: executionReport.clientOrderId,
            orderId: executionReport.orderId.toString(),
            status: 'partial',
            data: executionReport
          });
          break;
      }
    }
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    // Keep alive interval: 25 minutes for spot, 50 minutes for futures
    const interval = this.config.mode.includes('spot') ? 25 * 60 * 1000 : 50 * 60 * 1000;
    
    this.keepAliveInterval = setInterval(async () => {
      if (this.listenKey && this.isConnected) {
        try {
          await this.restClient.keepAliveUserDataStream(this.listenKey);
          console.log('ListenKey yenilendi');
          
          // Emit watchdog metric
          this.emit('watchdog:keepalive', {
            success: true,
            timestamp: new Date(),
            listenKey: this.listenKey
          });
        } catch (error) {
          console.error('ListenKey yenileme hatası:', error);
          
          // Emit watchdog metric
          this.emit('watchdog:keepalive', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            listenKey: this.listenKey
          });
          
          // Try to get new listenKey
          await this.refreshListenKey();
        }
      }
    }, interval);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private async refreshListenKey(): Promise<void> {
    try {
      await this.getListenKey();
      await this.disconnectWebSocket();
      await this.connectWebSocket();
    } catch (error) {
      console.error('ListenKey yenileme hatası:', error);
    }
  }

  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maksimum yeniden bağlanma denemesi aşıldı');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.reconnectInterval = setTimeout(async () => {
      console.log(`Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      // Emit reconnect metric
      this.emit('watchdog:reconnect', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        timestamp: new Date()
      });
      
      try {
        await this.refreshListenKey();
      } catch (error) {
        console.error('Yeniden bağlanma hatası:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  isStreamConnected(): boolean {
    return this.isConnected;
  }

  getListenKeyValue(): string | null {
    return this.listenKey;
  }
} 