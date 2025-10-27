export type Side = "buy" | "sell";
export type MarketType = "spot" | "futures" | "equity";

export interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  ts: number;
}

export interface ExchangeAdapter {
  id: "binance" | "binance-tr" | "btcturk" | "btcturk-hisse" | "bist";
  markets: MarketType[];

  // Data
  streamTicker(symbol: string, cb: (t: Ticker) => void): () => void;

  // Trading
  placeOrder(p: {
    symbol: string;
    side: Side;
    qty: number;
    price?: number;
    type: "limit" | "market";
  }): Promise<{ id: string }>;

  cancelOrder(id: string, symbol: string): Promise<void>;
  fetchOpenOrders(symbol?: string): Promise<any[]>;
  fetchPositions?(): Promise<any[]>; // futures için
}

// Symbol utils (normalize placeholders)
export function normalizeSymbol(input: string): string {
  // Examples:
  // - Binance: BNBUSDT ↔ BNB/USDT
  // - BTCTurk: BTCTRY
  // - BIST: ISCTR.E
  return input.replace("/", "").toUpperCase();
}


