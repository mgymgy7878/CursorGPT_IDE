export interface ExecutionStartParams {
  strategyId?: string;
  mode: 'testnet' | 'live' | 'paper';
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  confirm?: 'auto' | 'human';
}

export interface ExecutionResult {
  executionId: string;
  status: 'arm' | 'confirm' | 'live' | 'filled' | 'cancelled' | 'error';
  orderId?: string;
  clientOrderId?: string;
  nextStep?: string;
  error?: string;
}

export interface OrderResult {
  orderId: string;
  clientOrderId: string;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  price: number;
  qty: number;
  timestamp: Date;
}

export interface ExecutionEvent {
  type: 'execution:started' | 'execution:placed' | 'execution:filled' | 'execution:cancelled' | 'execution:error';
  executionId: string;
  data: any;
  timestamp?: Date;
}

export interface TradeEvent {
  type: 'trade:filled' | 'trade:partial' | 'trade:cancelled';
  executionId: string;
  tradeId: string;
  data: {
    symbol: string;
    side: 'BUY' | 'SELL';
    qty: number;
    price: number;
    fee?: number;
    feeAsset?: string;
    maker?: boolean;
    timestamp: Date;
  };
}

export interface ExecutionData {
  id: string;
  strategyId?: string;
  mode: string;
  symbol: string;
  side: string;
  qty: number;
  status: string;
  exchangeOrderId?: string;
  clientOrderId?: string;
  startedAt: Date;
  endedAt?: Date;
  lastState: string;
}

export interface TradeData {
  id: string;
  symbol: string;
  side: string;
  qty: number;
  price?: number;
  fee?: number;
  feeAsset?: string;
  maker?: boolean;
  ts: Date;
  clientId?: string;
  executionId?: string;
} 