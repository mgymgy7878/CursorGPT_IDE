import { randomUUID } from "crypto";

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
  idempotencyKey?: string;
}

export interface OrderResponse {
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price: number;
  status: 'FILLED' | 'PARTIALLY_FILLED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  executedQty: number;
  cummulativeQuoteQty: number;
  timestamp: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  unrealizedPnL: number;
  marginType: string;
  isolatedMargin: number;
  isAutoAddMargin: boolean;
  positionSide: string;
  notional: number;
  isolatedWallet: number;
  updateTime: number;
}

export interface AccountInfo {
  totalWalletBalance: number;
  totalUnrealizedProfit: number;
  totalMarginBalance: number;
  totalMaintMargin: number;
  totalInitialMargin: number;
  totalPositionInitialMargin: number;
  totalOpenOrderInitialMargin: number;
  totalCrossWalletBalance: number;
  totalCrossUnPnl: number;
  availableBalance: number;
  maxWithdrawAmount: number;
}

export class BinanceTestnetBroker {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private idempotencyKeys: Set<string> = new Set();
  private positions: Map<string, Position> = new Map();
  private orders: Map<string, OrderResponse> = new Map();

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://testnet.binancefuture.com';
  }

  async placeOrder(request: OrderRequest): Promise<OrderResponse> {
    // Check idempotency
    const idempotencyKey = request.idempotencyKey || randomUUID();
    if (this.idempotencyKeys.has(idempotencyKey)) {
      const existingOrder = this.findOrderByIdempotencyKey(idempotencyKey);
      if (existingOrder) {
        return existingOrder;
      }
    }

    // Risk checks
    if (!this.checkRiskLimits(request)) {
      throw new Error('Risk limits exceeded');
    }

    // Simulate order placement (in real implementation, call Binance API)
    const order: OrderResponse = {
      orderId: randomUUID(),
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: request.price || this.getCurrentPrice(request.symbol),
      status: 'FILLED', // Simulate immediate fill
      executedQty: request.quantity,
      cummulativeQuoteQty: request.quantity * (request.price || this.getCurrentPrice(request.symbol)),
      timestamp: Date.now()
    };

    // Store order and idempotency key
    this.orders.set(order.orderId, order);
    this.idempotencyKeys.add(idempotencyKey);

    // Update positions
    this.updatePosition(order);

    return order;
  }

  async getAccountInfo(): Promise<AccountInfo> {
    // Simulate account info (in real implementation, call Binance API)
    const totalBalance = 10000; // Mock initial balance
    const unrealizedPnL = this.calculateTotalUnrealizedPnL();
    
    return {
      totalWalletBalance: totalBalance,
      totalUnrealizedProfit: unrealizedPnL,
      totalMarginBalance: totalBalance + unrealizedPnL,
      totalMaintMargin: 0,
      totalInitialMargin: 0,
      totalPositionInitialMargin: 0,
      totalOpenOrderInitialMargin: 0,
      totalCrossWalletBalance: totalBalance,
      totalCrossUnPnl: unrealizedPnL,
      availableBalance: totalBalance,
      maxWithdrawAmount: totalBalance
    };
  }

  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async getOrder(orderId: string): Promise<OrderResponse | null> {
    return this.orders.get(orderId) || null;
  }

  async cancelOrder(symbol: string, orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (order && order.status === 'PENDING') {
      order.status = 'CANCELLED';
      return true;
    }
    return false;
  }

  private checkRiskLimits(request: OrderRequest): boolean {
    // Check kill switch
    if (process.env.TRADING_KILL_SWITCH === '1') {
      return false;
    }

    // Check position limits
    const maxPos = parseInt(process.env.RISK_MAX_POS || '1');
    if (this.positions.size >= maxPos) {
      return false;
    }

    // Check daily loss limit
    const dailyLossCap = parseFloat(process.env.RISK_DAILY_LOSS_CAP || '100');
    const dailyPnL = this.calculateDailyPnL();
    if (dailyPnL < -dailyLossCap) {
      return false;
    }

    // Check cooldown
    const cooldownMs = parseInt(process.env.RISK_COOLDOWN_MS || '60000');
    const lastOrderTime = this.getLastOrderTime();
    if (Date.now() - lastOrderTime < cooldownMs) {
      return false;
    }

    return true;
  }

  private updatePosition(order: OrderResponse): void {
    const existing = this.positions.get(order.symbol);
    
    if (order.side === 'BUY') {
      if (existing) {
        // Add to existing position
        const totalQuantity = existing.quantity + order.executedQty;
        const totalValue = (existing.avgPrice * existing.quantity) + (order.price * order.executedQty);
        existing.avgPrice = totalValue / totalQuantity;
        existing.quantity = totalQuantity;
        existing.notional = totalValue;
        existing.updateTime = order.timestamp;
      } else {
        // New position
        this.positions.set(order.symbol, {
          symbol: order.symbol,
          quantity: order.executedQty,
          avgPrice: order.price,
          unrealizedPnL: 0,
          marginType: 'cross',
          isolatedMargin: 0,
          isAutoAddMargin: false,
          positionSide: 'BOTH',
          notional: order.price * order.executedQty,
          isolatedWallet: 0,
          updateTime: order.timestamp
        });
      }
    } else {
      if (existing) {
        // Reduce position
        existing.quantity -= order.executedQty;
        existing.notional = existing.avgPrice * existing.quantity;
        existing.updateTime = order.timestamp;
        
        if (existing.quantity <= 0) {
          this.positions.delete(order.symbol);
        }
      }
    }
  }

  private getCurrentPrice(symbol: string): number {
    // Mock price (in real implementation, get from market data)
    const mockPrices: Record<string, number> = {
      'BTCUSDT': 45000,
      'ETHUSDT': 3000,
      'ADAUSDT': 0.5
    };
    return mockPrices[symbol] || 100;
  }

  private calculateTotalUnrealizedPnL(): number {
    return Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  }

  private calculateDailyPnL(): number {
    // Mock daily P&L calculation
    return this.calculateTotalUnrealizedPnL();
  }

  private getLastOrderTime(): number {
    if (this.orders.size === 0) return 0;
    return Math.max(...Array.from(this.orders.values()).map(o => o.timestamp));
  }

  private findOrderByIdempotencyKey(idempotencyKey: string): OrderResponse | null {
    // In a real implementation, you'd store idempotency key mapping
    return null;
  }

  // Mock methods for testing
  mockUpdatePrices(): void {
    for (const position of this.positions.values()) {
      const currentPrice = this.getCurrentPrice(position.symbol);
      position.unrealizedPnL = (currentPrice - position.avgPrice) * position.quantity;
    }
  }
} 