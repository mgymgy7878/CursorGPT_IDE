// ML Signals Package - Main Entry Point
import type { Price, Quantity, Symbol } from "@spark/types";

export * from "./microstructure.js";
export * from "./ta.js";
export * from "./flow.js";

// Re-export types for convenience
export type { 
  MicrostructureSignal, 
  SpreadSignal, 
  ImbalanceSignal, 
  RollSignal 
} from "./microstructure.js";

export type { 
  TechnicalSignal, 
  RSISignal, 
  MACDSignal, 
  BollingerSignal 
} from "./ta.js";

export type { 
  FlowSignal, 
  VolumeImbalanceSignal, 
  LatencyAwareSignal 
} from "./flow.js";

// Import the actual classes
import { MicrostructureSignalGenerator } from "./microstructure.js";
import { TechnicalSignalGenerator } from "./ta.js";
import { FlowSignalGenerator } from "./flow.js";

// Main signal generator class
export class MLSignalGenerator {
  private microstructure: MicrostructureSignalGenerator;
  private technical: TechnicalSignalGenerator;
  private flow: FlowSignalGenerator;

  constructor() {
    this.microstructure = new MicrostructureSignalGenerator();
    this.technical = new TechnicalSignalGenerator();
    this.flow = new FlowSignalGenerator();
  }

  /**
   * Generate all ML signals for a given symbol and market data
   */
  generateAllSignals(
    symbol: Symbol,
    marketData: {
      // Microstructure data
      bidPrice: Price;
      askPrice: Price;
      bidVolume: Quantity;
      askVolume: Quantity;
      currentPrice: Price;
      previousPrice: Price;
      
      // Technical data
      prices: Price[];
      
      // Flow data
      buyVolume: Quantity;
      sellVolume: Quantity;
      latencyMs: number;
      priceImpact: number;
    },
    timestamp: Date
  ) {
    const microstructureSignals = this.microstructure.generateAllSignals(
      symbol,
      {
        bidPrice: marketData.bidPrice,
        askPrice: marketData.askPrice,
        bidVolume: marketData.bidVolume,
        askVolume: marketData.askVolume,
        currentPrice: marketData.currentPrice,
        previousPrice: marketData.previousPrice
      },
      timestamp
    );

    const technicalSignals = this.technical.generateAllSignals(
      symbol,
      marketData.prices,
      timestamp
    );

    const flowSignals = this.flow.generateAllSignals(
      symbol,
      {
        buyVolume: marketData.buyVolume,
        sellVolume: marketData.sellVolume,
        latencyMs: marketData.latencyMs,
        priceImpact: marketData.priceImpact
      },
      timestamp
    );

    return {
      microstructure: microstructureSignals,
      technical: technicalSignals,
      flow: flowSignals,
      all: [...microstructureSignals, ...technicalSignals, ...flowSignals]
    };
  }

  /**
   * Get signal metadata for monitoring and validation
   */
  getSignalMetadata() {
    return {
      microstructure: {
        signals: ['bid_ask_spread', 'order_imbalance', 'price_roll'],
        p95Scope: '100-200ms',
        latencyImpact: 'Low-Medium',
        leakageRisk: 'None'
      },
      technical: {
        signals: ['rsi', 'macd', 'bollinger_bands'],
        p95Scope: '50-100ms',
        latencyImpact: 'Low-Medium',
        leakageRisk: 'None'
      },
      flow: {
        signals: ['volume_imbalance', 'latency_aware'],
        p95Scope: '50-300ms',
        latencyImpact: 'Low-High',
        leakageRisk: 'None'
      }
    };
  }
} 

// Auto-generated barrel exports
// removed accidental absolute barrel entries
