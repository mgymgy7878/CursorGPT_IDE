export function getMetric(metrics: unknown, key: string): number | null {
  if (!metrics || typeof metrics !== "object") return null;
  const rec = metrics as Record<string, unknown>;
  if (!(key in rec)) return null;
  const v = rec[key];
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}


