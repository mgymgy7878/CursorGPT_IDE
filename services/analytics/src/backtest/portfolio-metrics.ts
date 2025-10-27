import { Counter, Gauge, Histogram } from "prom-client";

// Portfolio backtest runs counter
export const portfolioRunsTotal = new Counter({
  name: "spark_backtest_portfolio_runs_total",
  help: "Total number of portfolio backtest runs",
  labelNames: ["symbols_count"],
});

// Portfolio symbols count gauge
export const portfolioSymbolsCount = new Gauge({
  name: "spark_backtest_portfolio_symbols_count",
  help: "Current number of symbols in portfolio backtest",
});

// Portfolio average correlation gauge
export const portfolioCorrelationAvg = new Gauge({
  name: "spark_backtest_portfolio_correlation_avg",
  help: "Average correlation across portfolio assets",
  labelNames: ["symbols_count"],
});

// Portfolio diversification benefit gauge
export const portfolioDiversificationBenefit = new Gauge({
  name: "spark_backtest_portfolio_diversification_benefit",
  help: "Diversification benefit (portfolio_sharpe - avg_individual_sharpe)",
  labelNames: ["symbols_count"],
});

// Portfolio backtest latency histogram
export const portfolioLatencyMs = new Histogram({
  name: "spark_backtest_portfolio_latency_ms",
  help: "Portfolio backtest duration in milliseconds",
  labelNames: ["symbols_count"],
  buckets: [500, 1000, 2000, 3000, 5000, 8000, 10000, 15000],
});

/**
 * Helper: Record portfolio run
 */
export function recordPortfolioRun(symbolsCount: number) {
  portfolioRunsTotal.inc({ symbols_count: String(symbolsCount) });
  portfolioSymbolsCount.set(symbolsCount);
}

/**
 * Helper: Record portfolio metrics
 */
export function recordPortfolioMetrics(
  symbolsCount: number,
  correlation: number,
  diversificationBenefit: number
) {
  portfolioCorrelationAvg.set({ symbols_count: String(symbolsCount) }, correlation);
  portfolioDiversificationBenefit.set(
    { symbols_count: String(symbolsCount) },
    diversificationBenefit
  );
}

/**
 * Helper: Record portfolio latency
 */
export function recordPortfolioLatency(symbolsCount: number, durationMs: number) {
  portfolioLatencyMs.observe({ symbols_count: String(symbolsCount) }, durationMs);
}

