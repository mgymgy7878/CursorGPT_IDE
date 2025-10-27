import { Counter, Histogram, Gauge } from "prom-client";

// Optimization jobs counter
export const optJobsTotal = new Counter({
  name: "spark_backtest_opt_jobs_total",
  help: "Total number of optimization jobs",
  labelNames: ["objective"],
});

// Optimization latency histogram
export const optLatencyMs = new Histogram({
  name: "spark_backtest_opt_latency_ms",
  help: "Optimization job duration in milliseconds",
  labelNames: ["combinations"],
  buckets: [1000, 5000, 10000, 20000, 30000, 60000, 120000],
});

// Candidates tested counter
export const optCandidatesTotal = new Counter({
  name: "spark_backtest_opt_candidates_total",
  help: "Total number of parameter combinations tested",
});

// WFO filtered counter (overfitting cases)
export const optWfoFilteredTotal = new Counter({
  name: "spark_backtest_opt_wfo_filtered_total",
  help: "Total number of candidates filtered by WFO (overfitting)",
});

// Best score gauge
export const optBestScore = new Gauge({
  name: "spark_backtest_opt_best_score",
  help: "Best optimization score achieved",
  labelNames: ["symbol", "objective"],
});

/**
 * Helper: Record optimization run
 */
export function recordOptRun(objective: string, combinations: number) {
  optJobsTotal.inc({ objective });
  optCandidatesTotal.inc(combinations);
}

/**
 * Helper: Record optimization latency
 */
export function recordOptLatency(combinations: number, durationMs: number) {
  optLatencyMs.observe({ combinations: String(combinations) }, durationMs);
}

/**
 * Helper: Record WFO filtering
 */
export function recordWfoFiltered(count: number) {
  optWfoFilteredTotal.inc(count);
}

/**
 * Helper: Record best score
 */
export function recordBestScore(symbol: string, objective: string, score: number) {
  optBestScore.set({ symbol, objective }, score);
}

