import { z } from "zod";

const MetricsSchema = z.object({
  status: z.string().default("unknown"),
  p95: z.number().nullable().optional(),
  staleness: z.number().nullable().optional(),
  errorRate: z.number().nullable().optional(),
}).passthrough();

export async function fetchDashboardMetrics(): Promise<z.infer<typeof MetricsSchema>> {
  const res = await fetch("/api/tools/metrics/timeseries?window=1h", { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return { status: "unknown", p95: null, staleness: null, errorRate: null };
  const json = await res.json().catch(() => ({}));
  return MetricsSchema.parse(json); // status hep var (unknown fallback)
}
