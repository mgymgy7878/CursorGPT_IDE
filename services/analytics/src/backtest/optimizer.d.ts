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
export declare function generateCombinations(grid: GridConfig): Array<Record<string, any>>;
/**
 * Run grid search with bounded concurrency
 */
export declare function runGridSearch<T>(candles: any[], backtestFn: (bars: any[], config: T) => {
    sharpe: number;
    winRate: number;
    ddMax: number;
    pnl: number;
    trades: number;
}, baseConfig: T, grid: GridConfig, objective?: 'sharpe' | 'pnl' | 'winRate', poolSize?: number): Promise<OptimizationSummary>;
/**
 * Run grid search with WFO validation on top candidates
 */
export declare function runGridSearchWithWFO<T>(candles: any[], backtestFn: (bars: any[], config: T) => {
    sharpe: number;
    winRate: number;
    ddMax: number;
    pnl: number;
    trades: number;
}, walkForwardFn: (bars: any[], config: T) => Promise<{
    train: any;
    test: any;
    overfitting: {
        ratio: number;
        detected: boolean;
    };
}>, baseConfig: T, grid: GridConfig, objective?: 'sharpe' | 'pnl' | 'winRate', topN?: number): Promise<OptimizationSummary>;
//# sourceMappingURL=optimizer.d.ts.map