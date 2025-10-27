import type { Price, Symbol } from "@spark/types";

const toNum = (p: Price | number): number => p as unknown as number;

export interface TechnicalSignal {
  type: 'technical';
  name: string;
  value: number;
  confidence: number;
  timestamp: Date;
  symbol: Symbol;
}

export interface RSISignal extends TechnicalSignal {
  name: 'rsi';
  rsiValue: number;
  overbought: boolean;
  oversold: boolean;
}

export interface MACDSignal extends TechnicalSignal {
  name: 'macd';
  macdLine: number;
  signalLine: number;
  histogram: number;
  bullish: boolean;
}

export interface BollingerSignal extends TechnicalSignal {
  name: 'bollinger_bands';
  upperBand: number;
  middleBand: number;
  lowerBand: number;
  position: 'upper' | 'middle' | 'lower';
  squeeze: boolean;
}

export class TechnicalSignalGenerator {
  private readonly rsiPeriod: number;
  private readonly macdFast: number;
  private readonly macdSlow: number;
  private readonly macdSignal: number;
  private readonly bbPeriod: number;
  private readonly bbStdDev: number;

  constructor(
    rsiPeriod: number = 14,
    macdFast: number = 12,
    macdSlow: number = 26,
    macdSignal: number = 9,
    bbPeriod: number = 20,
    bbStdDev: number = 2
  ) {
    this.rsiPeriod = rsiPeriod;
    this.macdFast = macdFast;
    this.macdSlow = macdSlow;
    this.macdSignal = macdSignal;
    this.bbPeriod = bbPeriod;
    this.bbStdDev = bbStdDev;
  }

  calculateRSISignal(
    symbol: Symbol,
    prices: Price[],
    timestamp: Date
  ): RSISignal {
    if (prices.length < this.rsiPeriod + 1) {
      throw new Error(`Insufficient data for RSI calculation. Need at least ${this.rsiPeriod + 1} prices.`);
    }

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i];
      const prevPrice = prices[i - 1];
      if (currentPrice && prevPrice) {
        const change = toNum(currentPrice) - toNum(prevPrice);
        gains.push(Math.max(0, change));
        losses.push(Math.max(0, -change));
      }
    }

    const avgGain = gains.slice(-this.rsiPeriod).reduce((sum, gain) => sum + gain, 0) / this.rsiPeriod;
    const avgLoss = losses.slice(-this.rsiPeriod).reduce((sum, loss) => sum + loss, 0) / this.rsiPeriod;

    const rs = avgGain / (avgLoss || 1e-12);
    const rsiValue = 100 - (100 / (1 + rs));

    const overbought = rsiValue > 70;
    const oversold = rsiValue < 30;
    
    const confidence = overbought || oversold ? 0.8 : 0.5;

    return {
      type: 'technical',
      name: 'rsi',
      value: rsiValue,
      confidence,
      timestamp,
      symbol,
      rsiValue,
      overbought,
      oversold
    };
  }

  calculateMACDSignal(
    symbol: Symbol,
    prices: Price[],
    timestamp: Date
  ): MACDSignal {
    if (prices.length < this.macdSlow) {
      throw new Error(`Insufficient data for MACD calculation. Need at least ${this.macdSlow} prices.`);
    }

    const emaFast = this.calculateEMA(prices, this.macdFast);
    const emaSlow = this.calculateEMA(prices, this.macdSlow);
    
    const macdLine = emaFast - emaSlow;
    
    const macdValues = this.calculateMACDLine(prices);
    const signalLine = this.calculateEMA(macdValues, this.macdSignal);
    
    const histogram = macdLine - signalLine;
    const bullish = macdLine > signalLine;
    
    const confidence = Math.min(1, Math.abs(histogram) / 0.01);

    return {
      type: 'technical',
      name: 'macd',
      value: histogram,
      confidence,
      timestamp,
      symbol,
      macdLine,
      signalLine,
      histogram,
      bullish
    };
  }

  calculateBollingerSignal(
    symbol: Symbol,
    prices: Price[],
    timestamp: Date
  ): BollingerSignal {
    if (prices.length < this.bbPeriod) {
      throw new Error(`Insufficient data for Bollinger Bands calculation. Need at least ${this.bbPeriod} prices.`);
    }

    const recentPrices = prices.slice(-this.bbPeriod).map(toNum);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / this.bbPeriod;
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / this.bbPeriod;
    const stdDev = Math.sqrt(variance) || 1e-12;
    
    const upperBand = sma + (this.bbStdDev * stdDev);
    const lowerBand = sma - (this.bbStdDev * stdDev);
    const lastPrice = prices[prices.length - 1];
    if (!lastPrice) {
      throw new Error('No price data available for Bollinger Bands calculation');
    }
    const currentPrice = toNum(lastPrice);
    
    let position: 'upper' | 'middle' | 'lower';
    if (currentPrice > upperBand) position = 'upper';
    else if (currentPrice < lowerBand) position = 'lower';
    else position = 'middle';
    
    const bandWidth = upperBand - lowerBand;
    const avgBandWidth = this.calculateAverageBandWidth(prices.map(toNum));
    const squeeze = bandWidth < avgBandWidth * 0.8;
    
    const distanceFromMiddle = Math.abs(currentPrice - sma) / stdDev;
    const confidence = Math.min(1, distanceFromMiddle / 2);

    return {
      type: 'technical',
      name: 'bollinger_bands',
      value: (currentPrice - sma) / stdDev,
      confidence,
      timestamp,
      symbol,
      upperBand,
      middleBand: sma,
      lowerBand,
      position,
      squeeze
    };
  }

  generateAllSignals(
    symbol: Symbol,
    prices: Price[],
    timestamp: Date
  ): TechnicalSignal[] {
    return [
      this.calculateRSISignal(symbol, prices, timestamp),
      this.calculateMACDSignal(symbol, prices, timestamp),
      this.calculateBollingerSignal(symbol, prices, timestamp)
    ];
  }

  private calculateEMA(prices: Array<Price | number>, period: number): number {
    const seq = prices.map(toNum);
    const multiplier = 2 / (period + 1);
    let ema = seq[0]!;
    
    for (let i = 1; i < seq.length; i++) {
      ema = (seq[i]! * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema as number;
  }

  private calculateMACDLine(prices: Price[]): number[] {
    const emaFast = this.calculateEMA(prices, this.macdFast);
    const emaSlow = this.calculateEMA(prices, this.macdSlow);
    return [emaFast - emaSlow];
  }

  private calculateAverageBandWidth(prices: number[]): number {
    return 0.02; // 2% average band width
  }
} 