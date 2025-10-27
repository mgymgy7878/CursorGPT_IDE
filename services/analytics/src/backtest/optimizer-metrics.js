"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optBestScore = exports.optWfoFilteredTotal = exports.optCandidatesTotal = exports.optLatencyMs = exports.optJobsTotal = void 0;
exports.recordOptRun = recordOptRun;
exports.recordOptLatency = recordOptLatency;
exports.recordWfoFiltered = recordWfoFiltered;
exports.recordBestScore = recordBestScore;
const prom_client_1 = require("prom-client");
// Optimization jobs counter
exports.optJobsTotal = new prom_client_1.Counter({
    name: "spark_backtest_opt_jobs_total",
    help: "Total number of optimization jobs",
    labelNames: ["objective"],
});
// Optimization latency histogram
exports.optLatencyMs = new prom_client_1.Histogram({
    name: "spark_backtest_opt_latency_ms",
    help: "Optimization job duration in milliseconds",
    labelNames: ["combinations"],
    buckets: [1000, 5000, 10000, 20000, 30000, 60000, 120000],
});
// Candidates tested counter
exports.optCandidatesTotal = new prom_client_1.Counter({
    name: "spark_backtest_opt_candidates_total",
    help: "Total number of parameter combinations tested",
});
// WFO filtered counter (overfitting cases)
exports.optWfoFilteredTotal = new prom_client_1.Counter({
    name: "spark_backtest_opt_wfo_filtered_total",
    help: "Total number of candidates filtered by WFO (overfitting)",
});
// Best score gauge
exports.optBestScore = new prom_client_1.Gauge({
    name: "spark_backtest_opt_best_score",
    help: "Best optimization score achieved",
    labelNames: ["symbol", "objective"],
});
/**
 * Helper: Record optimization run
 */
function recordOptRun(objective, combinations) {
    exports.optJobsTotal.inc({ objective });
    exports.optCandidatesTotal.inc(combinations);
}
/**
 * Helper: Record optimization latency
 */
function recordOptLatency(combinations, durationMs) {
    exports.optLatencyMs.observe({ combinations: String(combinations) }, durationMs);
}
/**
 * Helper: Record WFO filtering
 */
function recordWfoFiltered(count) {
    exports.optWfoFilteredTotal.inc(count);
}
/**
 * Helper: Record best score
 */
function recordBestScore(symbol, objective, score) {
    exports.optBestScore.set({ symbol, objective }, score);
}
//# sourceMappingURL=optimizer-metrics.js.map