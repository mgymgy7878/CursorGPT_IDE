export type DataQuality = 'live' | 'seed';

export type MarketTab = 'favorites' | 'usdt' | 'btc';

export type TickerRow = {
  symbol: string;
  last: number | null;
  change24hPct: number | null;
  quote: 'USDT' | 'BTC' | 'USD';
  isFav: boolean;
};

export type OrderBookEntry = {
  price: number;
  qty: number;
};

export type OrderBook = {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
};
