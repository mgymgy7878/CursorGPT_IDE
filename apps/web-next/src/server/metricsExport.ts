export type MetricsSnapshot = {
  counters?: Record<string, number>;
  gauges?: Record<string, number>;
  ts?: number; // epoch ms
};

const sanitize = (name: string): string =>
  name
    .replace(/[^\w:]/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "");

export function snapshotToPromText(s: MetricsSnapshot): string {
  const lines: string[] = [];
  const counters = s.counters ?? {};
  const gauges = s.gauges ?? {};

  for (const [k, v] of Object.entries(gauges)) {
    const n = sanitize(k);
    lines.push(`# TYPE ${n} gauge`);
    lines.push(`${n} ${Number.isFinite(v) ? v : 0}`);
  }

  for (const [k, v] of Object.entries(counters)) {
    const base = sanitize(k.endsWith("_total") ? k : `${k}_total`);
    lines.push(`# TYPE ${base} counter`);
    lines.push(`${base} ${Number.isFinite(v) ? v : 0}`);
  }

  if (s.ts) {
    lines.push(`# HELP spark_metrics_ts_ms Metrics snapshot timestamp in ms`);
    lines.push(`# TYPE spark_metrics_ts_ms gauge`);
    lines.push(`spark_metrics_ts_ms ${s.ts}`);
  }

  return lines.join("\n") + "\n";
}


