// Data Normalization
import type { Symbol, Price, Quantity } from "@spark/types";

export interface NormalizedData {
  symbol: Symbol;
  price: Price;
  volume: Quantity;
  timestamp: number;
}

export function normalizeTicker(data: any): NormalizedData {
  return {
    symbol: data.symbol as Symbol,
    price: data.price as Price,
    volume: data.volume as Quantity,
    timestamp: Date.now()
  };
}

export function normalizeOrderbook(data: any) {
  return {
    symbol: data.symbol as Symbol,
    bids: data.bids || [],
    asks: data.asks || [],
    timestamp: Date.now()
  };
} 