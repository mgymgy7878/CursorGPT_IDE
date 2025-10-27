export type Venue = 'binance' | 'btcturk' | 'bist' | 'fx' | 'commodity';

export type Ticker = {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  ts: number;
  venue: Venue;
  mock: boolean;
};
