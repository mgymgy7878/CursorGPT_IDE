import { Counter, Histogram } from "prom-client";

// Walk-forward timing metrics
export const walkforwardTrainMs = new Histogram({
  name: "spark_backtest_walkforward_train_ms",
  help: "Walk-forward training segment duration in milliseconds",
  labelNames: ["fold"],
  buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
});

export const walkforwardTestMs = new Histogram({
  name: "spark_backtest_walkforward_test_ms",
  help: "Walk-forward test segment duration in milliseconds",
  labelNames: ["fold"],
  buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
});

export const walkforwardValidateMs = new Histogram({
  name: "spark_backtest_walkforward_validate_ms",
  help: "Walk-forward validation segment duration in milliseconds",
  labelNames: ["fold"],
  buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
});

// Overfitting detection counter
export const overfittingDetectedTotal = new Counter({
  name: "spark_backtest_overfitting_detected_total",
  help: "Total number of overfitting cases detected",
  labelNames: ["symbol", "timeframe"],
});

// Walk-forward runs counter
export const walkforwardRunsTotal = new Counter({
  name: "spark_backtest_walkforward_runs_total",
  help: "Total number of walk-forward optimization runs",
  labelNames: ["symbol", "folds"],
});

/**
 * Helper: Time an async function and record to histogram
 */
export async function withTimer<T>(
  histogram: Histogram<string>,
  labels: Record<string, string | number>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    histogram.observe(labels, duration);
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    histogram.observe(labels, duration);
    throw err;
  }
}

/**
 * Helper: Record overfitting detection
 */
export function recordOverfitting(symbol: string, timeframe: string) {
  overfittingDetectedTotal.inc({ symbol, timeframe });
}

/**
 * Helper: Record walk-forward run
 */
export function recordWalkforwardRun(symbol: string, folds: number) {
  walkforwardRunsTotal.inc({ symbol, folds: String(folds) });
}

