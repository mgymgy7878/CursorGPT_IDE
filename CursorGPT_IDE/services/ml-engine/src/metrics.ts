// ML Engine Prometheus Metrics
import { Counter, Gauge, Histogram } from "prom-client";

export const optTrialsTotal = new Counter({
  name: "opt_trials_total",
  help: "Total number of optimization trials",
  labelNames: ["status", "experiment_id"]
});

export const optBestScore = new Gauge({
  name: "opt_best_score",
  help: "Best score achieved in optimization",
  labelNames: ["experiment_id"]
});

export const optRuntimeMs = new Histogram({
  name: "opt_runtime_ms",
  help: "Optimization trial runtime",
  labelNames: ["experiment_id"],
  buckets: [100, 500, 1000, 2000, 5000, 10000]
});

export const optQueueSize = new Gauge({
  name: "opt_queue_size",
  help: "Number of trials in queue"
});

export const optActiveExperiments = new Gauge({
  name: "opt_active_experiments",
  help: "Number of active experiments"
});

// Update metrics
export function updateTrialMetrics(experimentId: string, status: string) {
  optTrialsTotal.inc({ status, experiment_id: experimentId });
}

export function updateBestScore(experimentId: string, score: number) {
  optBestScore.set({ experiment_id: experimentId }, score);
}

export function recordRuntime(experimentId: string, runtimeMs: number) {
  optRuntimeMs.observe({ experiment_id: experimentId }, runtimeMs);
}

export function updateQueueSize(size: number) {
  optQueueSize.set(size);
}

export function updateActiveExperiments(count: number) {
  optActiveExperiments.set(count);
} 