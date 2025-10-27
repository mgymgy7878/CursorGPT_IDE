import type { Symbol, Price, Quantity } from "@spark/types";

// BTCTurk ticker normalization
export function normalizeTicker(data: any) {
  return {
    symbol: data.symbol as Symbol,
    price: data.price as Price,
    volume: data.volume as Quantity,
    timestamp: Date.now()
  };
}

// BTCTurk orderbook normalization
export function normalizeOrderbook(data: any) {
  return {
    symbol: data.symbol as Symbol,
    bids: data.bids.map((bid: any) => ({
      price: bid.price as Price,
      quantity: bid.quantity as Quantity
    })),
    asks: data.asks.map((ask: any) => ({
      price: ask.price as Price,
      quantity: ask.quantity as Quantity
    })),
    timestamp: Date.now()
  };
} 