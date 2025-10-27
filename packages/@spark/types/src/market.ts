import type { Price, Quantity, Symbol, TimestampMs } from "./primitives";

export interface MarketData {
  symbol: Symbol;
  price: Price;
  volume: Quantity;
  timestamp: TimestampMs;
}

export interface Candle {
  symbol: Symbol;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Quantity;
  timestamp: TimestampMs;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
}

export interface Ticker {
  symbol: Symbol;
  price: Price;
  volume24h: Quantity;
  priceChange24h: Price;
  priceChangePercent24h: number;
  timestamp: TimestampMs;
}

export interface MarketDepth {
  symbol: Symbol;
  bids: Array<{ price: Price; quantity: Quantity }>;
  asks: Array<{ price: Price; quantity: Quantity }>;
  timestamp: TimestampMs;
} 