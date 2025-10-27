import type { Symbol } from "@spark/types";

export interface StrategyConfig {
  id: string;
  name: string;
  description?: string;
  symbols: Symbol[];
  parameters: Record<string, number>;
  enabled: boolean;
}

export interface GeneratedStrategy {
  code: string;
  config: StrategyConfig;
  metadata: {
    version: string;
    generatedAt: number;
    dependencies: string[];
  };
}

export class StrategyCodeGenerator {
  generateRSIStrategy(config: StrategyConfig): GeneratedStrategy {
    const code = `
import { rsi } from "@spark/algo-core";

export function ${config.name}(prices: number[], period: number = 14): 'BUY' | 'SELL' | 'HOLD' {
  const rsiValues = rsi(prices, period);
  const currentRSI = rsiValues[rsiValues.length - 1];
  
  if (currentRSI < 30) return 'BUY';
  if (currentRSI > 70) return 'SELL';
  return 'HOLD';
}
    `.trim();

    return {
      code,
      config,
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        dependencies: ['@spark/algo-core']
      }
    };
  }

  generateMovingAverageStrategy(config: StrategyConfig): GeneratedStrategy {
    const code = `
export function ${config.name}(prices: number[], shortPeriod: number = 10, longPeriod: number = 20): 'BUY' | 'SELL' | 'HOLD' {
  if (prices.length < longPeriod) return 'HOLD';
  
  const shortMA = prices.slice(-shortPeriod).reduce((a, b) => a + b, 0) / shortPeriod;
  const longMA = prices.slice(-longPeriod).reduce((a, b) => a + b, 0) / longPeriod;
  
  if (shortMA > longMA) return 'BUY';
  if (shortMA < longMA) return 'SELL';
  return 'HOLD';
}
    `.trim();

    return {
      code,
      config,
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        dependencies: []
      }
    };
  }

  generateBollingerBandsStrategy(config: StrategyConfig): GeneratedStrategy {
    const code = `
export function ${config.name}(prices: number[], period: number = 20, stdDev: number = 2): 'BUY' | 'SELL' | 'HOLD' {
  if (prices.length < period) return 'HOLD';
  
  const recentPrices = prices.slice(-period);
  const sma = recentPrices.reduce((a, b) => a + b, 0) / period;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  const upperBand = sma + (stdDev * standardDeviation);
  const lowerBand = sma - (stdDev * standardDeviation);
  const currentPrice = prices[prices.length - 1];
  
  if (currentPrice <= lowerBand) return 'BUY';
  if (currentPrice >= upperBand) return 'SELL';
  return 'HOLD';
}
    `.trim();

    return {
      code,
      config,
      metadata: {
        version: '1.0.0',
        generatedAt: Date.now(),
        dependencies: []
      }
    };
  }
} 