import axios, { type AxiosInstance } from "axios";
import type { BISTQuote, BISTOHLCV, BISTIndex, BISTFeedConfig } from "./Types";
import type { NormalizedOHLCV } from "./Normalizer";
import { BISTNormalizer } from "./Normalizer";

export interface BISTDataReader {
  getQuotes(symbols: string[]): Promise<BISTQuote[]>;
  getOHLCV(symbol: string, timeframe: string, limit?: number): Promise<BISTOHLCV[]>;
  getIndexData(indexName: string): Promise<BISTIndex>;
  getRealTimeData(symbols: string[]): Promise<BISTQuote[]>;
}

export class BISTReader implements BISTDataReader {
  private client: AxiosInstance;
  private config: BISTFeedConfig;

  constructor(config: BISTFeedConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });
  }

  async getQuotes(symbols: string[]): Promise<BISTQuote[]> {
    try {
      const response = await this.client.get('/api/quotes', {
        params: { symbols: symbols.join(',') }
      });

      return response.data.map((quote: any) => ({
        symbol: quote.symbol,
        price: parseFloat(quote.price),
        change: parseFloat(quote.change),
        changePercent: parseFloat(quote.changePercent),
        volume: parseInt(quote.volume),
        high: parseFloat(quote.high),
        low: parseFloat(quote.low),
        open: parseFloat(quote.open),
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to fetch BIST quotes:', error);
      return [];
    }
  }

  async getOHLCV(symbol: string, timeframe: string, limit: number = 100): Promise<BISTOHLCV[]> {
    try {
      const response = await this.client.get('/api/ohlcv', {
        params: { symbol, timeframe, limit }
      });

      return response.data.map((candle: any) => ({
        symbol: candle.symbol,
        timestamp: new Date(candle.timestamp).getTime(),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseInt(candle.volume)
      }));
    } catch (error) {
      console.error(`Failed to fetch OHLCV for ${symbol}:`, error);
      return [];
    }
  }

  async getIndexData(indexName: string): Promise<BISTIndex> {
    try {
      const response = await this.client.get('/api/index', {
        params: { name: indexName }
      });

      return {
        name: response.data.name,
        value: parseFloat(response.data.value),
        change: parseFloat(response.data.change),
        changePercent: parseFloat(response.data.changePercent),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Failed to fetch index data for ${indexName}:`, error);
      return {
        name: indexName,
        value: 0,
        change: 0,
        changePercent: 0,
        timestamp: Date.now()
      };
    }
  }

  async getRealTimeData(symbols: string[]): Promise<BISTQuote[]> {
    if (!this.config.enableRealTime) {
      return this.getQuotes(symbols);
    }

    try {
      // WebSocket veya SSE implementasyonu burada olacak
      // Şimdilik polling kullanıyoruz
      return this.getQuotes(symbols);
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
      return [];
    }
  }

  async getNormalizedOHLCV(
    symbol: string,
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit: number = 100
  ): Promise<NormalizedOHLCV[]> {
    const rawData = await this.getOHLCV(symbol, timeframe, limit);
    const normalized = rawData
      .map(data => BISTNormalizer.normalizeOHLCV(data))
      .filter((data): data is NormalizedOHLCV => data !== null);

    return BISTNormalizer.aggregateOHLCV(rawData, timeframe);
  }

  async getBIST30Data(): Promise<BISTQuote[]> {
    const symbols = [
      'AKBNK', 'ASELS', 'BIMAS', 'EKGYO', 'EREGL', 'FROTO', 'GARAN', 'HEKTS',
      'ISCTR', 'KCHOL', 'KOZAL', 'KRDMD', 'MGROS', 'OYAKC', 'PETKM', 'PGSUS',
      'SAHOL', 'SASA', 'SISE', 'TAVHL', 'THYAO', 'TOASO', 'TSKB', 'TUPRS',
      'VAKBN', 'YKBNK', 'YYLGD', 'ZRGYO'
    ];

    return this.getQuotes(symbols);
  }

  async getBIST100Data(): Promise<BISTQuote[]> {
    // BIST100 için daha fazla sembol eklenebilir
    const symbols = [
      ...['AKBNK', 'ASELS', 'BIMAS', 'EKGYO', 'EREGL', 'FROTO', 'GARAN', 'HEKTS'],
      ...['ISCTR', 'KCHOL', 'KOZAL', 'KRDMD', 'MGROS', 'OYAKC', 'PETKM', 'PGSUS'],
      ...['SAHOL', 'SASA', 'SISE', 'TAVHL', 'THYAO', 'TOASO', 'TSKB', 'TUPRS'],
      ...['VAKBN', 'YKBNK', 'YYLGD', 'ZRGYO', 'ADEL', 'AFYON', 'AGESA', 'AGHOL']
    ];

    return this.getQuotes(symbols);
  }

  async getMarketSummary(): Promise<{
    indices: BISTIndex[];
    topGainers: BISTQuote[];
    topLosers: BISTQuote[];
    mostActive: BISTQuote[];
  }> {
    try {
      const [bist30, bist100] = await Promise.all([
        this.getBIST30Data(),
        this.getBIST100Data()
      ]);

      const allQuotes = [...bist30, ...bist100];

      const topGainers = allQuotes
        .filter(q => q.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 10);

      const topLosers = allQuotes
        .filter(q => q.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 10);

      const mostActive = allQuotes
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);

      const indices = await Promise.all([
        this.getIndexData('BIST30'),
        this.getIndexData('BIST100'),
        this.getIndexData('BIST50')
      ]);

      return {
        indices,
        topGainers,
        topLosers,
        mostActive
      };
    } catch (error) {
      console.error('Failed to fetch market summary:', error);
      return {
        indices: [],
        topGainers: [],
        topLosers: [],
        mostActive: []
      };
    }
  }
} 