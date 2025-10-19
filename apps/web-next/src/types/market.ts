export type Ticker = {
  symbol: string;     // BTCUSDT
  price: number;      // last price
  bid: number;        // best bid
  ask: number;        // best ask
  volume24h?: number;
  change24h?: number; // -0.012 = -1.2%
  ts: number;         // epoch ms
};

export type Health = 'connecting' | 'healthy' | 'degraded' | 'down';
export type Staleness = 'ok' | 'warn' | 'stale';

