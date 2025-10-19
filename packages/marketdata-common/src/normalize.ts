/**
 * Normalized ticker data structure
 */
export interface NormalizedTicker {
  exchange: string;
  symbol: string;
  lastPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}

/**
 * Normalized orderbook entry
 */
export interface NormalizedOrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

/**
 * Normalized orderbook structure
 */
export interface NormalizedOrderBook {
  exchange: string;
  symbol: string;
  bids: NormalizedOrderBookEntry[];
  asks: NormalizedOrderBookEntry[];
  timestamp: number;
}

/**
 * BTCTurk ticker raw data
 */
interface BTCTurkTickerRaw {
  pair: string;
  last: number;
  high: number;
  low: number;
  volume: number;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}

/**
 * BTCTurk orderbook raw data
 */
interface BTCTurkOrderBookRaw {
  pair: string;
  bids: Array<[number, number]>; // [price, amount]
  asks: Array<[number, number]>;
  timestamp?: number;
}

/**
 * Normalize BTCTurk ticker data to common format
 */
export function normalizeBtcturkTicker(raw: BTCTurkTickerRaw): NormalizedTicker {
  return {
    exchange: 'BTCTurk',
    symbol: raw.pair,
    lastPrice: raw.last,
    high24h: raw.high,
    low24h: raw.low,
    volume24h: raw.volume,
    change24h: raw.change ?? 0,
    changePercent24h: raw.changePercent ?? 0,
    timestamp: raw.timestamp ?? Date.now()
  };
}

/**
 * Normalize BTCTurk orderbook data to common format
 */
export function normalizeBtcturkOrderBook(raw: BTCTurkOrderBookRaw): NormalizedOrderBook {
  const bids = raw.bids.map(([price, amount]) => ({
    price,
    amount,
    total: price * amount
  }));

  const asks = raw.asks.map(([price, amount]) => ({
    price,
    amount,
    total: price * amount
  }));

  return {
    exchange: 'BTCTurk',
    symbol: raw.pair,
    bids,
    asks,
    timestamp: raw.timestamp ?? Date.now()
  };
}

/**
 * Merge orderbook updates (incremental)
 * Returns new orderbook with updates applied
 */
export function mergeOrderbook(
  base: NormalizedOrderBook,
  updates: { bids?: NormalizedOrderBookEntry[], asks?: NormalizedOrderBookEntry[] }
): NormalizedOrderBook {
  const newOrderbook = { ...base };

  // Update bids
  if (updates.bids) {
    const bidMap = new Map(base.bids.map(b => [b.price, b]));
    
    for (const bid of updates.bids) {
      if (bid.amount === 0) {
        bidMap.delete(bid.price);
      } else {
        bidMap.set(bid.price, bid);
      }
    }

    newOrderbook.bids = Array.from(bidMap.values())
      .sort((a, b) => b.price - a.price) // Descending
      .slice(0, 20); // Keep top 20
  }

  // Update asks
  if (updates.asks) {
    const askMap = new Map(base.asks.map(a => [a.price, a]));
    
    for (const ask of updates.asks) {
      if (ask.amount === 0) {
        askMap.delete(ask.price);
      } else {
        askMap.set(ask.price, ask);
      }
    }

    newOrderbook.asks = Array.from(askMap.values())
      .sort((a, b) => a.price - b.price) // Ascending
      .slice(0, 20); // Keep top 20
  }

  newOrderbook.timestamp = Date.now();
  return newOrderbook;
}

/**
 * Calculate orderbook spread
 */
export function calculateSpread(orderbook: NormalizedOrderBook): {
  absolute: number;
  percentage: number;
} {
  if (orderbook.bids.length === 0 || orderbook.asks.length === 0) {
    return { absolute: 0, percentage: 0 };
  }

  const bestBid = orderbook.bids[0].price;
  const bestAsk = orderbook.asks[0].price;
  const absolute = bestAsk - bestBid;
  const percentage = (absolute / bestBid) * 100;

  return { absolute, percentage };
}

/**
 * Calculate orderbook depth (total volume at each side)
 */
export function calculateDepth(orderbook: NormalizedOrderBook): {
  bidDepth: number;
  askDepth: number;
} {
  const bidDepth = orderbook.bids.reduce((sum, bid) => sum + bid.total, 0);
  const askDepth = orderbook.asks.reduce((sum, ask) => sum + ask.total, 0);

  return { bidDepth, askDepth };
}
