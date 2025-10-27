export interface ExchangeAdapter {
  fetchBars(symbol: string, timeframe: string, limit: number): Promise<{ timestamp: string; price: number }[]>;
} 