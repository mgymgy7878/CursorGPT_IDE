/**
 * Market Data Normalization
 */

export interface NormalizedTicker {
  symbol: string;
  venue: string;
  price: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  timestamp: number;
  timezone: string;
}

export function normalizeBTCTurkTicker(raw: any, sparkSymbol: string): NormalizedTicker {
  return {
    symbol: sparkSymbol,
    venue: 'btcturk',
    price: parseFloat(raw.last || raw.lastPrice || '0'),
    volume24h: parseFloat(raw.volume || raw.dailyVolume || '0'),
    high24h: parseFloat(raw.high || raw.dailyHigh || '0'),
    low24h: parseFloat(raw.low || raw.dailyLow || '0'),
    change24h: parseFloat(raw.dailyChangePercent || raw.change || '0'),
    timestamp: raw.timestamp || Date.now(),
    timezone: 'Europe/Istanbul',
  };
}

export function normalizeBISTSnapshot(raw: any, sparkSymbol: string): NormalizedTicker {
  return {
    symbol: sparkSymbol,
    venue: 'bist',
    price: parseFloat(raw.lastPrice || raw.price || '0'),
    volume24h: parseFloat(raw.volume || '0'),
    high24h: parseFloat(raw.high || '0'),
    low24h: parseFloat(raw.low || '0'),
    change24h: parseFloat(raw.changePercent || '0'),
    timestamp: raw.timestamp || Date.now(),
    timezone: 'Europe/Istanbul',
  };
}

