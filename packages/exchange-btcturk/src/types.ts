export interface BTCTurkConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  wsUrl?: string;
  timeout?: number;
}

export interface BTCTurkSymbol {
  id: string;
  name: string;
  nameNormalized: string;
  status: string;
  numeratorCurrency: string;
  denominatorCurrency: string;
  numeratorScale: number;
  denominatorScale: number;
  hasFraction: boolean;
  filters: any[];
  minOrderAmount: string;
  maxOrderAmount: string;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  minPrice: string;
  maxPrice: string;
}

export interface BTCTurkTicker {
  pair: string;
  pairNormalized: string;
  timestamp: number;
  last: string;
  high: string;
  low: string;
  bid: string;
  ask: string;
  open: string;
  volume: string;
  average: string;
  daily: string;
  dailyPercent: string;
  denominatorSymbol: string;
  numeratorSymbol: string;
}

export interface BTCTurkTrade {
  pair: string;
  pairNormalized: string;
  numerator: string;
  denominator: string;
  date: number;
  tid: string;
  price: string;
  amount: string;
}

export interface BTCTurkOrderBook {
  pair: string;
  pairNormalized: string;
  timestamp: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface BTCTurkKline {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface BTCTurkAccount {
  id: string;
  currency: string;
  currencySymbol: string;
  balance: string;
  available: string;
  reserved: string;
  pending: string;
}

export interface BTCTurkOrder {
  id: string;
  price: string;
  amount: string;
  quantity: string;
  stopPrice: string;
  icebergQuantity: string;
  status: string;
  type: string;
  side: string;
  timeInForce: string;
  postOnly: boolean;
  time: number;
  updateTime: number;
  clientOrderId: string;
  symbol: string;
}

export interface BTCTurkWSMessage {
  type: string;
  channel: string;
  data: any;
  timestamp: number;
}

export interface BTCTurkMetrics {
  httpRequestsTotal: number;
  wsMessagesTotal: number;
  wsDisconnectsTotal: number;
  clockSkewSeconds: number;
  lastUpdate: number;
}