// Grid Search Optimizer for Strategy Parameters
// Bounded concurrency with DuckDB result storage

import os from 'os';

export type GridConfig = {
  emaFast?: number[];
  emaSlow?: number[];
  atr?: number[];
  atrMult?: number[];
  takeProfitRR?: number[];
};

export type OptimizationResult = {
  params: Record<string, any>;
  metrics: {
    sharpe: number;
    winRate: number;
    ddMax: number;
    pnl: number;
    trades: number;
  };
  wfo?: {
    ratio: number;
    detected: boolean;
  };
};

export type OptimizationSummary = {
  totalCombinations: number;
  completed: number;
  bestParams: Record<string, any>;
  bestScore: number;
  objective: string;
  leaderboard: OptimizationResult[];
  timing: {
    totalMs: number;
    avgPerRun: number;
  };
};

/**
 * Generate all combinations from grid (Cartesian product)
 */
export function generateCombinations(grid: GridConfig): Array<Record<string, any>> {
  const keys = Object.keys(grid) as Array<keyof GridConfig>;
  const values = keys.map(k => grid[k] || []);
  
  if (values.some(v => v.length === 0)) {
    return [];
  }
  
  const combinations: Array<Record<string, any>> = [];
  
  function recurse(index: number, current: Record<string, any>) {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }
    
    const key = keys[index];
    const vals = values[index];
    
    for (const val of vals) {
      current[key] = val;
      recurse(index + 1, current);
    }
  }
  
  recurse(0, {});
  return combinations;
}

/**
 * Run grid search with bounded concurrency
 */
export async function runGridSearch<T>(
  candles: any[],
  backtestFn: (bars: any[], config: T) => { sharpe: number; winRate: number; ddMax: number; pnl: number; trades: number },
  baseConfig: T,
  grid: GridConfig,
  objective: 'sharpe' | 'pnl' | 'winRate' = 'sharpe',
  poolSize?: number
): Promise<OptimizationSummary> {
  const combinations = generateCombinations(grid);
  const totalCombinations = combinations.length;
  
  if (totalCombinations === 0) {
    throw new Error('Grid config produced no combinations');
  }
  
  // Bounded concurrency
  const maxConcurrency = poolSize || Math.min(os.cpus().length, 8);
  const results: OptimizationResult[] = [];
  
  const startTime = Date.now();
  
  // Process in batches
  for (let i = 0; i < combinations.length; i += maxConcurrency) {
    const batch = combinations.slice(i, i + maxConcurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (params) => {
        try {
          const config = { ...baseConfig, ...params } as T;
          const metrics = backtestFn(candles, config);
          
          return {
            params,
            metrics,
          } as OptimizationResult;
        } catch (err) {
          console.error('Backtest failed for params:', params, err);
          return null;
        }
      })
    );
    
    results.push(...batchResults.filter((r): r is OptimizationResult => r !== null));
  }
  
  const totalTime = Date.now() - startTime;
  
  // Sort by objective
  results.sort((a, b) => b.metrics[objective] - a.metrics[objective]);
  
  const best = results[0];
  
  return {
    totalCombinations,
    completed: results.length,
    bestParams: best?.params || {},
    bestScore: best?.metrics[objective] || 0,
    objective,
    leaderboard: results.slice(0, 10), // Top 10
    timing: {
      totalMs: totalTime,
      avgPerRun: totalTime / results.length,
    },
  };
}

/**
 * Run grid search with WFO validation on top candidates
 */
export async function runGridSearchWithWFO<T>(
  candles: any[],
  backtestFn: (bars: any[], config: T) => { sharpe: number; winRate: number; ddMax: number; pnl: number; trades: number },
  walkForwardFn: (bars: any[], config: T) => Promise<{ train: any; test: any; overfitting: { ratio: number; detected: boolean } }>,
  baseConfig: T,
  grid: GridConfig,
  objective: 'sharpe' | 'pnl' | 'winRate' = 'sharpe',
  topN = 5
): Promise<OptimizationSummary> {
  // Step 1: Grid search
  const gridResult = await runGridSearch(candles, backtestFn, baseConfig, grid, objective);
  
  // Step 2: WFO validation on top N candidates
  const topCandidates = gridResult.leaderboard.slice(0, topN);
  
  const wfoResults = await Promise.all(
    topCandidates.map(async (candidate) => {
      try {
        const config = { ...baseConfig, ...candidate.params } as T;
        const wfo = await walkForwardFn(candles, config);
        
        return {
          ...candidate,
          wfo: wfo.overfitting,
        };
      } catch (err) {
        return candidate;
      }
    })
  );
  
  // Filter out overfitted
  const filtered = wfoResults.filter(r => !r.wfo?.detected);
  
  return {
    ...gridResult,
    leaderboard: filtered.length > 0 ? filtered : wfoResults, // If all overfitted, keep all
  };
}

