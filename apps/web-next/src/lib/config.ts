export const TARGETS = {
  P95_MS: Number(process.env.NEXT_PUBLIC_TARGET_P95_MS ?? 1200),
  STALENESS_S: Number(process.env.NEXT_PUBLIC_TARGET_STALENESS_S ?? 30)
};

export const BANDS = {
  warn: 1.0,  // > target → WARN
  alert: 2.0  // > 2x target → ALERT
};


