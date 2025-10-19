// SLO thresholds - single source of truth
export const SLO_TARGETS = {
  P95_MS: 1000,        // 1s target for P95 latency
  STALENESS_S: 60,     // 60s max staleness
  ERROR_RATE: 0.01     // 1% error rate threshold
} as const;

export const SLO_BANDS = {
  WARN: 1.0,   // > target → WARNING
  ALERT: 2.0   // > 2x target → ALERT
} as const;

// Helper to check SLO status
export function checkSLOStatus(metric: number, target: number): 'ok' | 'warn' | 'alert' {
  if (metric <= target) return 'ok';
  if (metric <= target * SLO_BANDS.WARN) return 'warn';
  return 'alert';
}

