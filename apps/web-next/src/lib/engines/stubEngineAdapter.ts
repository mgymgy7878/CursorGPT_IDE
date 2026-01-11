/**
 * Stub Engine Adapter - Deterministic stub implementation
 *
 * Mevcut jobStore mantığını kullanır, deterministic seed ile tekrarlanabilir sonuçlar.
 */

import { EngineAdapter, BacktestInput, OptimizeInput } from './engineAdapter';
import { JobResult } from '@/lib/jobs/jobStore';

class StubEngineAdapter implements EngineAdapter {
  /**
   * Generate deterministic result based on input hash
   */
  private generateDeterministicResult(input: string, type: 'backtest' | 'optimize'): JobResult {
    // Simple hash function for deterministic seed
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    const seed = Math.abs(hash);
    const trades = 50 + (seed % 100); // 50-150 trades
    const winRate = 45 + (seed % 15); // 45-60%
    const maxDrawdown = -5 - (seed % 10); // -5% to -15%
    const sharpe = 1.0 + (seed % 100) / 50; // 1.0-3.0
    const totalReturn = 5 + (seed % 20); // 5-25%

    return {
      trades,
      winRate,
      maxDrawdown,
      sharpe,
      totalReturn,
    };
  }

  async runBacktest(input: BacktestInput): Promise<JobResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate deterministic result based on input
    const inputKey = `${input.symbol}_${input.interval}_${input.startDate || 'default'}_${input.endDate || 'default'}`;
    return this.generateDeterministicResult(inputKey, 'backtest');
  }

  async runOptimize(input: OptimizeInput): Promise<JobResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate deterministic result based on input
    const inputKey = `${input.symbol}_${input.interval}_${JSON.stringify(input.baselineMetrics || {})}`;
    return this.generateDeterministicResult(inputKey, 'optimize');
  }
}

export const stubEngineAdapter = new StubEngineAdapter();

