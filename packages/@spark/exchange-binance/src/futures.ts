import { z } from 'zod';

// Binance Futures API Types
export const FuturesOrderSchema = z.object({
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['LIMIT', 'MARKET', 'STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET']),
  quantity: z.number().positive(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']).default('GTC'),
  reduceOnly: z.boolean().default(false),
  newClientOrderId: z.string().optional(),
  closePosition: z.boolean().default(false)
});

export const FuturesPositionSchema = z.object({
  symbol: z.string(),
  positionAmt: z.number(),
  entryPrice: z.number(),
  markPrice: z.number(),
  unRealizedProfit: z.number(),
  liquidationPrice: z.number(),
  leverage: z.number(),
  maxNotional: z.number(),
  marginType: z.enum(['isolated', 'cross']),
  isolatedMargin: z.number(),
  isAutoAddMargin: z.boolean(),
  positionSide: z.enum(['BOTH', 'LONG', 'SHORT']),
  notional: z.number(),
  isolatedWallet: z.number(),
  updateTime: z.number()
});

export const FuturesAccountSchema = z.object({
  totalWalletBalance: z.number(),
  totalUnrealizedProfit: z.number(),
  totalMarginBalance: z.number(),
  totalMaintMargin: z.number(),
  totalInitialMargin: z.number(),
  totalPositionInitialMargin: z.number(),
  totalOpenOrderInitialMargin: z.number(),
  totalCrossWalletBalance: z.number(),
  totalCrossUnPnl: z.number(),
  availableBalance: z.number(),
  maxWithdrawAmount: z.number(),
  canTrade: z.boolean(),
  canWithdraw: z.boolean(),
  canDeposit: z.boolean(),
  updateTime: z.number(),
  multiAssetsMargin: z.boolean(),
  tradeGroupId: z.number(),
  totalBalanceInBTC: z.number(),
  totalBalanceInUSDT: z.number()
});

export type FuturesOrder = z.infer<typeof FuturesOrderSchema>;
export type FuturesPosition = z.infer<typeof FuturesPositionSchema>;
export type FuturesAccount = z.infer<typeof FuturesAccountSchema>;

export interface BinanceFuturesConfig {
  apiKey: string;
  secretKey: string;
  testnet?: boolean;
  baseUrl?: string;
}

export class BinanceFuturesClient {
  private config: BinanceFuturesConfig;
  private baseUrl: string;

  constructor(config: BinanceFuturesConfig) {
    this.config = config;
    this.baseUrl = config.testnet 
      ? 'https://testnet.binancefuture.com'
      : config.baseUrl || 'https://fapi.binance.com';
  }

  // Account Information
  async getAccountInfo(): Promise<FuturesAccount> {
    const response = await this.makeRequest('GET', '/fapi/v2/account');
    return FuturesAccountSchema.parse(response);
  }

  // Position Management
  async getPositions(symbol?: string): Promise<FuturesPosition[]> {
    const params = symbol ? { symbol } : {};
    const response = await this.makeRequest('GET', '/fapi/v2/positionRisk', params);
    return response.map((pos: any) => FuturesPositionSchema.parse(pos));
  }

  async changeLeverage(symbol: string, leverage: number): Promise<any> {
    return this.makeRequest('POST', '/fapi/v1/leverage', {
      symbol,
      leverage
    });
  }

  async changeMarginType(symbol: string, marginType: 'isolated' | 'cross'): Promise<any> {
    return this.makeRequest('POST', '/fapi/v1/marginType', {
      symbol,
      marginType
    });
  }

  // Order Management
  async placeOrder(order: FuturesOrder): Promise<any> {
    const validatedOrder = FuturesOrderSchema.parse(order);
    return this.makeRequest('POST', '/fapi/v1/order', validatedOrder);
  }

  async cancelOrder(symbol: string, orderId?: number, origClientOrderId?: string): Promise<any> {
    const params: any = { symbol };
    if (orderId) params.orderId = orderId;
    if (origClientOrderId) params.origClientOrderId = origClientOrderId;
    
    return this.makeRequest('DELETE', '/fapi/v1/order', params);
  }

  async cancelAllOrders(symbol: string): Promise<any> {
    return this.makeRequest('DELETE', '/fapi/v1/allOpenOrders', { symbol });
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params = symbol ? { symbol } : {};
    return this.makeRequest('GET', '/fapi/v1/openOrders', params);
  }

  async getOrderHistory(symbol?: string, limit?: number): Promise<any[]> {
    const params: any = {};
    if (symbol) params.symbol = symbol;
    if (limit) params.limit = limit;
    
    return this.makeRequest('GET', '/fapi/v1/allOrders', params);
  }

  // Market Data
  async get24hrTicker(symbol?: string): Promise<any> {
    const params = symbol ? { symbol } : {};
    return this.makeRequest('GET', '/fapi/v1/ticker/24hr', params);
  }

  async getKlines(symbol: string, interval: string, limit?: number): Promise<any[]> {
    const params: any = { symbol, interval };
    if (limit) params.limit = limit;
    
    return this.makeRequest('GET', '/fapi/v1/klines', params);
  }

  async getOrderBook(symbol: string, limit?: number): Promise<any> {
    const params: any = { symbol };
    if (limit) params.limit = limit;
    
    return this.makeRequest('GET', '/fapi/v1/depth', params);
  }

  // Risk Management
  async setRiskLimit(symbol: string, riskId: number): Promise<any> {
    return this.makeRequest('POST', '/fapi/v1/riskLimit', {
      symbol,
      riskId
    });
  }

  async getRiskLimit(symbol: string): Promise<any[]> {
    return this.makeRequest('GET', '/fapi/v1/riskLimit', { symbol });
  }

  // Private API Request Helper
  private async makeRequest(method: string, endpoint: string, params: any = {}): Promise<any> {
    const url = new URL(this.baseUrl + endpoint);
    
    // Add timestamp for signed requests
    params.timestamp = Date.now();
    
    // Create signature
    const queryString = new URLSearchParams(params).toString();
    const signature = await this.createSignature(queryString);
    params.signature = signature;
    
    const finalQueryString = new URLSearchParams(params).toString();
    
    const response = await fetch(`${url}?${finalQueryString}`, {
      method,
      headers: {
        'X-MBX-APIKEY': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Binance API Error: ${error.msg || response.statusText}`);
    }

    return response.json();
  }

  private async createSignature(queryString: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.secretKey);
    const messageData = encoder.encode(queryString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// WebSocket Streams
export class BinanceFuturesWebSocket {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private streams: Set<string> = new Set();

  constructor(testnet: boolean = false) {
    this.baseUrl = testnet 
      ? 'wss://stream.binancefuture.com/ws/'
      : 'wss://fstream.binance.com/ws/';
  }

  subscribeToTicker(symbol: string, callback: (data: any) => void): void {
    const stream = `${symbol.toLowerCase()}@ticker`;
    this.streams.add(stream);
    this.connect(stream, callback);
  }

  subscribeToKlines(symbol: string, interval: string, callback: (data: any) => void): void {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    this.streams.add(stream);
    this.connect(stream, callback);
  }

  subscribeToDepth(symbol: string, callback: (data: any) => void): void {
    const stream = `${symbol.toLowerCase()}@depth`;
    this.streams.add(stream);
    this.connect(stream, callback);
  }

  subscribeToUserData(listenKey: string, callback: (data: any) => void): void {
    const stream = listenKey;
    this.streams.add(stream);
    this.connect(stream, callback);
  }

  private connect(stream: string, callback: (data: any) => void): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Add to existing connection
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [stream],
        id: Date.now()
      }));
    } else {
      // Create new connection
      this.ws = new WebSocket(this.baseUrl + stream);
      
      this.ws.onopen = () => {
        console.log('Binance Futures WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('Binance Futures WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('Binance Futures WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (this.streams.size > 0) {
            this.reconnect();
          }
        }, 5000);
      };
    }
  }

  private reconnect(): void {
    // Reconnect to all streams
    this.streams.forEach(stream => {
      this.connect(stream, () => {});
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.streams.clear();
  }
}

// Utility Functions
export const FuturesUtils = {
  // Calculate position size based on risk
  calculatePositionSize(
    accountBalance: number,
    riskPercentage: number,
    entryPrice: number,
    stopLossPrice: number,
    leverage: number = 1
  ): number {
    const riskAmount = accountBalance * (riskPercentage / 100);
    const priceDifference = Math.abs(entryPrice - stopLossPrice);
    const positionSize = (riskAmount / priceDifference) * leverage;
    return Math.floor(positionSize * 1000) / 1000; // Round to 3 decimal places
  },

  // Calculate PnL
  calculatePnL(
    positionSize: number,
    entryPrice: number,
    currentPrice: number,
    side: 'LONG' | 'SHORT'
  ): number {
    if (side === 'LONG') {
      return positionSize * (currentPrice - entryPrice);
    } else {
      return positionSize * (entryPrice - currentPrice);
    }
  },

  // Calculate liquidation price
  calculateLiquidationPrice(
    entryPrice: number,
    leverage: number,
    side: 'LONG' | 'SHORT',
    marginType: 'isolated' | 'cross' = 'isolated'
  ): number {
    if (side === 'LONG') {
      return entryPrice * (1 - (1 / leverage) + 0.004); // 0.4% maintenance margin
    } else {
      return entryPrice * (1 + (1 / leverage) - 0.004);
    }
  },

  // Format symbol for Binance
  formatSymbol(symbol: string): string {
    return symbol.replace('/', '').toUpperCase();
  },

  // Validate leverage
  validateLeverage(symbol: string, leverage: number): boolean {
    // Binance leverage limits vary by symbol
    const maxLeverage: Record<string, number> = {
      'BTCUSDT': 125,
      'ETHUSDT': 100,
      'ADAUSDT': 75,
      'DOTUSDT': 50,
      'LINKUSDT': 50
    };
    
    const max = maxLeverage[symbol] || 20;
    return leverage >= 1 && leverage <= max;
  }
};
