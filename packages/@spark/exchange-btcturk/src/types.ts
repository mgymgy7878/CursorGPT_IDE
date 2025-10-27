// BTCTurk Types
// Ticker/Trade/OrderBook minimal tipler (TODO: gerçek şema)

export interface Ticker {
  pair: string;
  pairNormalized: string;
  timestamp: number;
  last: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
  open: number;
  volume: number;
  average: number;
  daily: number;
  dailyPercent: number;
}

export interface Trade {
  pair: string;
  pairNormalized: string;
  date: number;
  tid: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
}

export interface OrderBookEntry {
  price: number;
  amount: number;
}

export interface OrderBook {
  pair: string;
  pairNormalized: string;
  timestamp: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface BTCTurkResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
