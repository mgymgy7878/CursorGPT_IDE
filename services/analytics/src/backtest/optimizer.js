"use strict";
// Grid Search Optimizer for Strategy Parameters
// Bounded concurrency with DuckDB result storage
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCombinations = generateCombinations;
exports.runGridSearch = runGridSearch;
exports.runGridSearchWithWFO = runGridSearchWithWFO;
const os_1 = __importDefault(require("os"));
/**
 * Generate all combinations from grid (Cartesian product)
 */
function generateCombinations(grid) {
    const keys = Object.keys(grid);
    const values = keys.map(k => grid[k] || []);
    if (values.some(v => v.length === 0)) {
        return [];
    }
    const combinations = [];
    function recurse(index, current) {
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
async function runGridSearch(candles, backtestFn, baseConfig, grid, objective = 'sharpe', poolSize) {
    const combinations = generateCombinations(grid);
    const totalCombinations = combinations.length;
    if (totalCombinations === 0) {
        throw new Error('Grid config produced no combinations');
    }
    // Bounded concurrency
    const maxConcurrency = poolSize || Math.min(os_1.default.cpus().length, 8);
    const results = [];
    const startTime = Date.now();
    // Process in batches
    for (let i = 0; i < combinations.length; i += maxConcurrency) {
        const batch = combinations.slice(i, i + maxConcurrency);
        const batchResults = await Promise.all(batch.map(async (params) => {
            try {
                const config = { ...baseConfig, ...params };
                const metrics = backtestFn(candles, config);
                return {
                    params,
                    metrics,
                };
            }
            catch (err) {
                console.error('Backtest failed for params:', params, err);
                return null;
            }
        }));
        results.push(...batchResults.filter((r) => r !== null));
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
async function runGridSearchWithWFO(candles, backtestFn, walkForwardFn, baseConfig, grid, objective = 'sharpe', topN = 5) {
    // Step 1: Grid search
    const gridResult = await runGridSearch(candles, backtestFn, baseConfig, grid, objective);
    // Step 2: WFO validation on top N candidates
    const topCandidates = gridResult.leaderboard.slice(0, topN);
    const wfoResults = await Promise.all(topCandidates.map(async (candidate) => {
        try {
            const config = { ...baseConfig, ...candidate.params };
            const wfo = await walkForwardFn(candles, config);
            return {
                ...candidate,
                wfo: wfo.overfitting,
            };
        }
        catch (err) {
            return candidate;
        }
    }));
    // Filter out overfitted
    const filtered = wfoResults.filter(r => !r.wfo?.detected);
    return {
        ...gridResult,
        leaderboard: filtered.length > 0 ? filtered : wfoResults, // If all overfitted, keep all
    };
}
//# sourceMappingURL=optimizer.js.map