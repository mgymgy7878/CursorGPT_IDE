import { Counter, Histogram } from "../lib/metrics.js";

export const canaryApplyTotal = new Counter({
  name: "canary_apply_total",
  help: "Total apply attempts",
  labelNames: ["accepted", "reason", "provider"],
});

export const canaryApplyDurationMs = new Histogram({
  name: "canary_apply_duration_ms",
  help: "Apply handler duration (ms)",
  buckets: [10, 25, 50, 100, 200, 500, 1000, 2000, 5000],
});

export const canaryIdemDuplicateTotal = new Counter({
  name: "canary_idem_duplicate_total",
  help: "Idempotency duplicate blocks",
});

export const canaryCircuitTrippedTotal = new Counter({
  name: "canary_circuit_tripped_total",
  help: "Circuit breaker tripped blocks",
});

export const canaryApplyBlockedTotal = new Counter({
  name: "canary_apply_blocked_total",
  help: "Blocked applies by reason",
  labelNames: ["reason"],
}); 