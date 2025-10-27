export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
export type TIF = 'GTC' | 'IOC'; // Good Till Cancelled | Immediate Or Cancel

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number; // Required for LIMIT, STOP_LIMIT
  stopPrice?: number; // Required for STOP_MARKET, STOP_LIMIT
  tif?: TIF; // Default: GTC
  status: OrderStatus;
  filledQuantity: number;
  averagePrice?: number;
  fee?: number;
  feeBps?: number;
  createdAt: number;
  updatedAt: number;
  cancelledAt?: number;
}

export interface Fill {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  fee: number;
  feeBps: number;
  timestamp: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  averagePrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalFees: number;
  lastUpdate: number;
}

export interface Account {
  balance: number;
  equity: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  dailyPnL: number;
  totalFees: number;
  feesAccrued: number;
  updatedAt: number;
}

export interface RiskConfig {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxLeverage: number;
  symbolAllowlist: string[];
  makerFeeBps: number;
  takerFeeBps: number;
}

export interface PaperEvent {
  type: 'order_placed' | 'order_filled' | 'order_cancelled' | 'order_rejected' | 'partial_fill' | 'position_update' | 'risk_violation';
  data: any;
  timestamp: number;
}

export interface BacktestResult {
  trades: Fill[];
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    totalFees: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  metadata: {
    symbol: string;
    interval: string;
    startTime: number;
    endTime: number;
    initialBalance: number;
    finalBalance: number;
  };
} 