import type { BISTOHLCV, BISTQuote } from "./Types";

export interface NormalizedOHLCV {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

export class BISTNormalizer {
  private static validateOHLCV(data: BISTOHLCV): boolean {
    return (
      data.open > 0 &&
      data.high >= data.open &&
      data.high >= data.close &&
      data.low <= data.open &&
      data.low <= data.close &&
      data.volume >= 0 &&
      data.timestamp > 0
    );
  }

  static normalizeOHLCV(data: BISTOHLCV): NormalizedOHLCV | null {
    if (!this.validateOHLCV(data)) {
      console.warn(`Invalid OHLCV data for ${data.symbol}:`, data);
      return null;
    }

    return {
      symbol: data.symbol,
      timestamp: data.timestamp,
      open: Math.round(data.open * 100) / 100, // 2 decimal places
      high: Math.round(data.high * 100) / 100,
      low: Math.round(data.low * 100) / 100,
      close: Math.round(data.close * 100) / 100,
      volume: Math.round(data.volume),
      timeframe: '1d' // Default timeframe
    };
  }

  static normalizeQuote(quote: BISTQuote): NormalizedOHLCV | null {
    // Convert quote to OHLCV format
    const ohlcv: BISTOHLCV = {
      symbol: quote.symbol,
      timestamp: quote.timestamp,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.price,
      volume: quote.volume
    };

    return this.normalizeOHLCV(ohlcv);
  }

  static aggregateOHLCV(
    data: BISTOHLCV[],
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  ): NormalizedOHLCV[] {
    if (data.length === 0) return [];

    const aggregated: NormalizedOHLCV[] = [];
    const grouped = this.groupByTimeframe(data, timeframe);

    for (const [period, candles] of Object.entries(grouped)) {
      if (candles.length === 0) continue;

      const first = candles[0];
      const last = candles[candles.length - 1];

      const aggregatedCandle: NormalizedOHLCV = {
        symbol: first?.symbol ?? '',
        timestamp: parseInt(period),
        open: first?.open ?? 0,
        high: Math.max(...candles.map(c => c.high)),
        low: Math.min(...candles.map(c => c.low)),
        close: last?.close ?? 0,
        volume: candles.reduce((sum, c) => sum + c.volume, 0),
        timeframe
      };

      aggregated.push(aggregatedCandle);
    }

    return aggregated.sort((a, b) => a.timestamp - b.timestamp);
  }

  private static groupByTimeframe(
    data: BISTOHLCV[],
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  ): Record<string, BISTOHLCV[]> {
    const grouped: Record<string, BISTOHLCV[]> = {};
    const intervalMs = this.getTimeframeMs(timeframe);

    for (const candle of data) {
      const period = Math.floor(candle.timestamp / intervalMs) * intervalMs;
      const key = period.toString();

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(candle);
    }

    return grouped;
  }

  private static getTimeframeMs(timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'): number {
    const multipliers = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };

    return multipliers[timeframe];
  }

  static calculateIndicators(data: NormalizedOHLCV[]): {
    sma: number[];
    ema: number[];
    rsi: number[];
    atr: number[];
  } {
    if (data.length === 0) {
      return { sma: [], ema: [], rsi: [], atr: [] };
    }

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);

    return {
      sma: this.calculateSMA(closes, 20),
      ema: this.calculateEMA(closes, 20),
      rsi: this.calculateRSI(closes, 14),
      atr: this.calculateATR(highs, lows, closes, 14)
    };
  }

  private static calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
        continue;
      }
      
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    
    return sma;
  }

  private static calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        ema.push(data[0] ?? 0);
        continue;
      }
      
      const currentEMA = ((data[i] ?? 0) * multiplier) + ((ema[i - 1] ?? 0) * (1 - multiplier));
      ema.push(currentEMA);
    }
    
    return ema;
  }

  private static calculateRSI(data: number[], period: number): number[] {
    const rsi: number[] = [];
    let gains = 0, losses = 0;
    
    for (let i = 1; i < data.length; i++) {
      const change = (data[i] ?? 0) - (data[i - 1] ?? 0);
      gains += Math.max(0, change);
      losses += Math.max(0, -change);
      
      if (i >= period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
        
        const oldChange = (data[i - period + 1] ?? 0) - (data[i - period] ?? 0);
        gains -= Math.max(0, oldChange);
        losses -= Math.max(0, -oldChange);
      } else {
        rsi.push(NaN);
      }
    }
    
    return rsi;
  }

  private static calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number
  ): number[] {
    const atr: number[] = [];
    let sum = 0;
    
    for (let i = 0; i < highs.length; i++) {
      const tr = Math.max(
        (highs[i] ?? 0) - (lows[i] ?? 0),
        Math.abs((highs[i] ?? 0) - ((closes[i - 1] ?? 0) || (closes[i] ?? 0))),
        Math.abs((lows[i] ?? 0) - ((closes[i - 1] ?? 0) || (closes[i] ?? 0)))
      );
      
      if (i < period) {
        sum += tr;
        atr.push(i === period - 1 ? sum / period : NaN);
      } else {
        sum = sum - (sum / period) + tr;
        atr.push(sum / period);
      }
    }
    
    return atr;
  }
} 