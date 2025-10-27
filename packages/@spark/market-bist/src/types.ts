// BIST Types
// Bar/Ticker tipleri (TODO)

export interface BISTBar {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BISTTicker {
  symbol: string;
  timestamp: number;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface BISTEvent {
  ts: number;
  type: 'bar' | 'ticker';
  symbol: string;
  data: BISTBar | BISTTicker;
}
