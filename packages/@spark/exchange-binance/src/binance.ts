// import fetch from "node-fetch";

export interface Ticker {
  symbol: string;
  price: string;
  volume: string;
  timestamp: number;
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export type Symbol = string;

export interface ExchangePublic {
  getTicker(symbol: Symbol): Promise<Ticker>;
  getKlines(symbol: Symbol, interval: string, limit?: number): Promise<Kline[]>;
  streamTrades(symbol: Symbol, onData: (t: Ticker) => void, onClose?: (e?: Error) => void): () => void;
}

export class BinancePublic implements ExchangePublic {
  constructor(private baseUrl: string = 'https://api.binance.com') {}

  async getTicker(symbol: Symbol): Promise<Ticker> {
    const response = await fetch(`${this.baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`);
    const data = await response.json();
    return {
      symbol: data.symbol,
      price: data.lastPrice,
      volume: data.volume,
      timestamp: Date.now()
    };
  }

  async getKlines(symbol: Symbol, interval: string, limit: number = 100): Promise<Kline[]> {
    const response = await fetch(`${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await response.json();
    return data.map((kline: any[]) => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6]
    }));
  }

  streamTrades(symbol: Symbol, onData: (t: Ticker) => void, onClose?: (e?: Error) => void): () => void {
    // Mock implementation
    const interval = setInterval(() => {
      onData({
        symbol,
        price: (50000 + Math.random() * 1000).toString(),
        volume: (Math.random() * 100).toString(),
        timestamp: Date.now()
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      onClose?.();
    };
  }
} 