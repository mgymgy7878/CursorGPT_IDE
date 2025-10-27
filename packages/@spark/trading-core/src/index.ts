import type { Symbol, Price, Quantity, OrderId } from "@spark/types";
import type { asOrderId, asQuantity, asPrice  } from "@spark/types";

// Re-export types for convenience
export type { Symbol, Price, Quantity, OrderId } from "@spark/types";
export { asOrderId, asQuantity, asPrice } from "@spark/types";

// Type aliases for backward compatibility
export type asSymbol = Symbol;
export type asPrice = Price;
export type asQuantity = Quantity;

export interface Order {
  id: OrderId;
  symbol: Symbol;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: Quantity;
  price?: Price;
  stopPrice?: Price;
  status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
  filledQuantity: Quantity;
  averagePrice: Price;
  timestamp: number;
}

export interface Trade {
  id: string;
  orderId: OrderId;
  symbol: Symbol;
  side: 'BUY' | 'SELL';
  quantity: Quantity;
  price: Price;
  fee: Price;
  feeAsset: string;
  timestamp: number;
}

export interface Position {
  symbol: Symbol;
  quantity: Quantity;
  averagePrice: Price;
  unrealizedPnL: Price;
  realizedPnL: Price;
  timestamp: number;
}

export interface Balance {
  asset: string;
  free: Quantity;
  locked: Quantity;
  total: Quantity;
}

export interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
  equity: number[];
  trades: Trade[];
}

export class TradingEngine {
  private orders: Map<OrderId, Order> = new Map();
  private trades: Trade[] = [];
  private positions: Map<Symbol, Position> = new Map();
  private balances: Map<string, Balance> = new Map();

  placeOrder(order: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'averagePrice' | 'timestamp'>): OrderId {
    const orderId = asOrderId(`order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const newOrder: Order = {
      ...order,
      id: orderId,
      status: 'PENDING',
      filledQuantity: asQuantity(0),
      averagePrice: asPrice(0),
      timestamp: Date.now()
    };
    this.orders.set(orderId, newOrder);
    return orderId;
  }

  cancelOrder(orderId: OrderId): boolean {
    const order = this.orders.get(orderId);
    if (order && order.status === 'PENDING') {
      order.status = 'CANCELLED';
      return true;
    }
    return false;
  }

  getOrder(orderId: OrderId): Order | undefined {
    return this.orders.get(orderId);
  }

  getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getBalances(): Balance[] {
    return Array.from(this.balances.values());
  }

  updateBalance(asset: string, free: Quantity, locked: Quantity): void {
    const total = asQuantity(free + locked);
    this.balances.set(asset, { asset, free, locked, total });
  }
} 