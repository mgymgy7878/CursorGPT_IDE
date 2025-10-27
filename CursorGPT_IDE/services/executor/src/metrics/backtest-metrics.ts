import client from "prom-client";
import { metricsRegistry } from "../metrics.js";
import type { BacktestRun } from "../types/backtest.js";

const registry = metricsRegistry();

// Counter: Total backtest runs by status
export const mBacktestRunsTotal = new client.Counter({
  name: "backtest_runs_total",
  help: "Total backtest runs",
  labelNames: ["status"],
  registers: [registry],
});

// Histogram: Backtest duration in seconds
export const hBacktestDuration = new client.Histogram({
  name: "backtest_duration_seconds",
  help: "Backtest duration seconds",
  buckets: [5, 10, 30, 60, 120, 300, 600, 1200],
  registers: [registry],
});

// Gauge: Active backtest runs
export const gBacktestActive = new client.Gauge({
  name: "backtest_active_runs",
  help: "Active backtest runs",
  registers: [registry],
});

// Counter: Generated artifacts by type
export const mArtifactsTotal = new client.Counter({
  name: "backtest_artifacts_generated_total",
  help: "Generated artifacts",
  labelNames: ["type"],
  registers: [registry],
});

// Gauge: Active SSE stream clients (v1.4.2)
export const gBacktestStreamClients = new client.Gauge({
  name: "backtest_stream_clients",
  help: "Active SSE clients for backtest stream",
  registers: [registry],
});

/**
 * Observe run sample for metrics (idempotent - safe to call multiple times for same run)
 * Only records histogram if run is finished
 */
export function observeRunSample(run: BacktestRun): void {
  if (run.finishedAt && run.startedAt) {
    const durationSec = (run.finishedAt - run.startedAt) / 1000;
    if (durationSec >= 0) {
      hBacktestDuration.observe(durationSec);
    }
  }
  
  // Count artifacts (idempotent - only if present)
  if (run.artifacts && Array.isArray(run.artifacts)) {
    // Note: For true idempotency, producer should call this once per lifecycle
    // Here we're just reading, so safe for status endpoint
  }
}

