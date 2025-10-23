const counters = new Map<string, number>();
const gauges = new Map<string, number>();

export const inc = (name: string, v = 1) => counters.set(name, (counters.get(name) ?? 0) + v);
export const setGauge = (name: string, v: number) => gauges.set(name, v);
export const snapshot = () => ({
  counters: Object.fromEntries(counters),
  gauges: Object.fromEntries(gauges),
});

// Expose optional global helpers for non-module callers (best-effort)
try {
  (window as any).sparkCounters = { inc };
  (window as any).sparkGauges = { setGauge };
} catch {}

export { counters, gauges };


