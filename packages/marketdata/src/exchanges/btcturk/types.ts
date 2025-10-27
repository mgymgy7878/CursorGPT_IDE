/**
 * BTCTurk Spot Exchange Types
 * Normalized types for Spark Trading Platform
 */

export type NormalizedTrade = {
  ts: number;  // epoch ms
  symbol: string; // BTCUSDT
  side: 'buy' | 'sell';
  price: number;
  qty: number;
  exchange: 'btcturk';
};

export type OrderBookDelta = {
  ts: number;
  symbol: string;
  bids: [number, number][]; // [price, qty]
  asks: [number, number][];
  exchange: 'btcturk';
};

export type NormalizedTicker = {
  ts: number;
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  exchange: 'btcturk';
};

export type BTCTurkRawTrade = {
  id: string;
  price: string;
  quantity: string;
  time: string;
  side: 'Buy' | 'Sell';
};

export type BTCTurkRawOrderBook = {
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
};

export type BTCTurkRawTicker = {
  pair: string;
  price: string;
  volume: string;
  change: string;
  timestamp: number;
};

export type BTCTurkWSMessage = {
  type: 'trades' | 'orderbook' | 'ticker';
  data: any;
  symbol: string;
};

export type BTCTurkConfig = {
  wsUrl: string;
  restUrl: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  symbols: string[];
};
