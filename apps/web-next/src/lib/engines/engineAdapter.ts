/**
 * Engine Adapter - Interface for backtest/optimize engines
 *
 * Stub ve gerçek engine arasında geçiş için adapter pattern.
 * UI ve API route'lar değişmeden gerçek hesaplama motorunu devreye alır.
 */

import { JobResult } from '@/lib/jobs/jobStore';

export interface BacktestInput {
  symbol: string;
  interval: string;
  startDate?: string;
  endDate?: string;
  klines?: number[][]; // Binance klines format: [open, high, low, close, volume, ...]
}

export interface OptimizeInput {
  symbol: string;
  interval: string;
  baselineMetrics?: JobResult; // Backtest result (for comparison)
  parameters?: Record<string, any>;
  klines?: number[][]; // Binance klines format: [open, high, low, close, volume, ...]
}

export interface EngineAdapter {
  runBacktest(input: BacktestInput): Promise<JobResult>;
  runOptimize(input: OptimizeInput): Promise<JobResult>;
}

/**
 * Get engine adapter based on SPARK_ENGINE_MODE
 *
 * SPARK_ENGINE_MODE=stub|real (default: stub)
 * prod'da zaten stub endpointler 404; gerçek engine geldiğinde prod enable edilecek.
 */
export function getEngineAdapter(): EngineAdapter {
  const mode = process.env.SPARK_ENGINE_MODE || 'stub';

  if (mode === 'real') {
    // Lazy import to avoid loading real engine if not needed
    const { realEngineAdapter } = require('./realEngineAdapter');
    return realEngineAdapter;
  }

  // Default: stub
  const { stubEngineAdapter } = require('./stubEngineAdapter');
  return stubEngineAdapter;
}

