import type { Price, Quantity, Symbol } from "@spark/types";

export interface FlowSignal {
  type: 'flow';
  name: string;
  value: number;
  confidence: number;
  timestamp: Date;
  symbol: Symbol;
}

export interface VolumeImbalanceSignal extends FlowSignal {
  name: 'volume_imbalance';
  buyVolume: Quantity;
  sellVolume: Quantity;
  imbalanceRatio: number;
  flowDirection: 'buy' | 'sell' | 'neutral';
}

export interface LatencyAwareSignal extends FlowSignal {
  name: 'latency_aware';
  latencyMs: number;
  priceImpact: number;
  urgency: 'high' | 'medium' | 'low';
}

export class FlowSignalGenerator {
  private readonly volumeThreshold: number;
  private readonly latencyThreshold: number;

  constructor(volumeThreshold: number = 1000, latencyThreshold: number = 100) {
    this.volumeThreshold = volumeThreshold;
    this.latencyThreshold = latencyThreshold;
  }

  /**
   * Calculate volume imbalance signal
   * P95 scope: 300ms
   * Latency impact: High (volume aggregation)
   * Leakage risk: None (current volume data only)
   */
  calculateVolumeImbalanceSignal(
    symbol: Symbol,
    buyVolume: Quantity,
    sellVolume: Quantity,
    timestamp: Date
  ): VolumeImbalanceSignal {
    const totalVolume = buyVolume + sellVolume;
    const imbalanceRatio = totalVolume > 0 ? (buyVolume - sellVolume) / totalVolume : 0;
    
    let flowDirection: 'buy' | 'sell' | 'neutral';
    if (imbalanceRatio > 0.1) flowDirection = 'buy';
    else if (imbalanceRatio < -0.1) flowDirection = 'sell';
    else flowDirection = 'neutral';
    
    // Confidence based on volume size and imbalance magnitude
    const volumeConfidence = Math.min(1, totalVolume / this.volumeThreshold);
    const imbalanceConfidence = Math.abs(imbalanceRatio);
    const confidence = (volumeConfidence + imbalanceConfidence) / 2;
    
    return {
      type: 'flow',
      name: 'volume_imbalance',
      value: imbalanceRatio,
      confidence,
      timestamp,
      symbol,
      buyVolume,
      sellVolume,
      imbalanceRatio,
      flowDirection
    };
  }

  /**
   * Calculate latency-aware signal
   * P95 scope: 50ms
   * Latency impact: Low (latency measurement)
   * Leakage risk: None (current latency only)
   */
  calculateLatencyAwareSignal(
    symbol: Symbol,
    latencyMs: number,
    priceImpact: number,
    timestamp: Date
  ): LatencyAwareSignal {
    let urgency: 'high' | 'medium' | 'low';
    if (latencyMs < this.latencyThreshold * 0.5) urgency = 'low';
    else if (latencyMs < this.latencyThreshold) urgency = 'medium';
    else urgency = 'high';
    
    // Confidence based on latency stability and price impact
    const latencyConfidence = Math.max(0, 1 - (latencyMs / this.latencyThreshold));
    const impactConfidence = Math.min(1, priceImpact * 100);
    const confidence = (latencyConfidence + impactConfidence) / 2;
    
    return {
      type: 'flow',
      name: 'latency_aware',
      value: latencyMs,
      confidence,
      timestamp,
      symbol,
      latencyMs,
      priceImpact,
      urgency
    };
  }

  /**
   * Generate all flow signals
   */
  generateAllSignals(
    symbol: Symbol,
    flowData: {
      buyVolume: Quantity;
      sellVolume: Quantity;
      latencyMs: number;
      priceImpact: number;
    },
    timestamp: Date
  ): FlowSignal[] {
    return [
      this.calculateVolumeImbalanceSignal(symbol, flowData.buyVolume, flowData.sellVolume, timestamp),
      this.calculateLatencyAwareSignal(symbol, flowData.latencyMs, flowData.priceImpact, timestamp)
    ];
  }
} 