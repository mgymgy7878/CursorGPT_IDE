import { Symbol, asSymbol } from "@spark/types";

// BIST 30 Index stocks
export const BIST30_SYMBOLS: Symbol[] = [
  'AKBNK', 'ASELS', 'BIMAS', 'EKGYO', 'EREGL', 'FROTO', 'GARAN', 'HEKTS',
  'ISCTR', 'KCHOL', 'KOZAL', 'KRDMD', 'MGROS', 'OYAKC', 'PETKM', 'PGSUS',
  'SAHOL', 'SASA', 'SISE', 'TAVHL', 'THYAO', 'TOASO', 'TSKB', 'TUPRS',
  'VAKBN', 'YKBNK', 'YYLGD', 'ZRGYO'
].map(asSymbol);

// BIST 100 Index stocks (BIST30 + additional stocks)
export const BIST100_SYMBOLS: Symbol[] = [
  ...BIST30_SYMBOLS,
  'ADEL', 'AFYON', 'AGESA', 'AGHOL', 'AHGAZ', 'AKCNS', 'AKENR', 'AKFGY',
  'AKGRT', 'AKMGY', 'AKSA', 'AKSEN', 'ALARK', 'ALBRK', 'ALCAR', 'ALGYO',
  'ALKIM', 'ALTIN', 'ANACM', 'ANELE', 'ANGEN', 'ARCLK', 'ASELS', 'ASELS',
  'ASELS', 'ASELS', 'ASELS', 'ASELS'
].map(asSymbol);

export interface BISTQuote {
  symbol: Symbol;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
}

export interface BISTOHLCV {
  symbol: Symbol;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BISTIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface BISTFeedConfig {
  baseUrl: string;
  apiKey?: string;
  symbols: Symbol[];
  updateInterval: number; // milliseconds
  enableRealTime: boolean;
}

export interface NormalizedOHLCV {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
}

export interface BISTDataReader {
  getQuotes(symbols: Symbol[]): Promise<BISTQuote[]>;
  getOHLCV(symbol: Symbol, timeframe: string, limit?: number): Promise<BISTOHLCV[]>;
  getIndexData(): Promise<BISTIndex[]>;
  getRealTimeData(symbols: Symbol[]): Promise<BISTQuote[]>;
} 