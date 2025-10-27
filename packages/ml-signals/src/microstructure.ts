import type { Price, Quantity, Symbol } from "@spark/types";

export interface MicrostructureSignal {
  type: 'microstructure';
  name: string;
  value: number;
  confidence: number;
  timestamp: Date;
  symbol: Symbol;
}

export interface SpreadSignal extends MicrostructureSignal {
  name: 'bid_ask_spread';
  bidPrice: Price;
  askPrice: Price;
  spreadRatio: number;
}

export interface ImbalanceSignal extends MicrostructureSignal {
  name: 'order_imbalance';
  bidVolume: Quantity;
  askVolume: Quantity;
  imbalanceRatio: number;
}

export interface RollSignal extends MicrostructureSignal {
  name: 'price_roll';
  currentPrice: Price;
  previousPrice: Price;
  rollDirection: 'up' | 'down' | 'neutral';
}

export class MicrostructureSignalGenerator {
  private readonly lookbackPeriod: number;

  constructor(lookbackPeriod: number = 20) {
    this.lookbackPeriod = lookbackPeriod;
  }

  /**
   * Calculate bid-ask spread signal
   * P95 scope: 100ms
   * Latency impact: Low (simple arithmetic)
   * Leakage risk: None (current market data only)
   */
  calculateSpreadSignal(
    symbol: Symbol,
    bidPrice: Price,
    askPrice: Price,
    timestamp: Date
  ): SpreadSignal {
    const spread = askPrice - bidPrice;
    const midPrice = (bidPrice + askPrice) / 2;
    const spreadRatio = spread / midPrice;
    
    // Confidence based on spread size (tighter spread = higher confidence)
    const confidence = Math.max(0, Math.min(1, 1 - spreadRatio * 100));
    
    return {
      type: 'microstructure',
      name: 'bid_ask_spread',
      value: spreadRatio,
      confidence,
      timestamp,
      symbol,
      bidPrice,
      askPrice,
      spreadRatio
    };
  }

  /**
   * Calculate order imbalance signal
   * P95 scope: 200ms
   * Latency impact: Medium (volume aggregation)
   * Leakage risk: None (current order book only)
   */
  calculateImbalanceSignal(
    symbol: Symbol,
    bidVolume: Quantity,
    askVolume: Quantity,
    timestamp: Date
  ): ImbalanceSignal {
    const totalVolume = bidVolume + askVolume;
    const imbalanceRatio = totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;
    
    // Confidence based on volume size
    const confidence = Math.min(1, totalVolume / 1000);
    
    return {
      type: 'microstructure',
      name: 'order_imbalance',
      value: imbalanceRatio,
      confidence,
      timestamp,
      symbol,
      bidVolume,
      askVolume,
      imbalanceRatio
    };
  }

  /**
   * Calculate price roll signal
   * P95 scope: 150ms
   * Latency impact: Low (price comparison)
   * Leakage risk: None (current vs previous price)
   */
  calculateRollSignal(
    symbol: Symbol,
    currentPrice: Price,
    previousPrice: Price,
    timestamp: Date
  ): RollSignal {
    const priceChange = currentPrice - previousPrice;
    const rollDirection = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';
    
    // Confidence based on price change magnitude
    const priceChangeRatio = Math.abs(priceChange) / previousPrice;
    const confidence = Math.min(1, priceChangeRatio * 100);
    
    return {
      type: 'microstructure',
      name: 'price_roll',
      value: priceChangeRatio,
      confidence,
      timestamp,
      symbol,
      currentPrice,
      previousPrice,
      rollDirection
    };
  }

  /**
   * Generate all microstructure signals
   */
  generateAllSignals(
    symbol: Symbol,
    marketData: {
      bidPrice: Price;
      askPrice: Price;
      bidVolume: Quantity;
      askVolume: Quantity;
      currentPrice: Price;
      previousPrice: Price;
    },
    timestamp: Date
  ): MicrostructureSignal[] {
    return [
      this.calculateSpreadSignal(symbol, marketData.bidPrice, marketData.askPrice, timestamp),
      this.calculateImbalanceSignal(symbol, marketData.bidVolume, marketData.askVolume, timestamp),
      this.calculateRollSignal(symbol, marketData.currentPrice, marketData.previousPrice, timestamp)
    ];
  }
} 