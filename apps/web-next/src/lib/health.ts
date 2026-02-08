/**
 * Health status utilities (single source for status pills)
 * V1.3-P4: getHealthStatus + mapStatus for SLO-based indicators
 */

export interface HealthMetrics {
  error_rate_p95?: number;
  staleness_s?: number;
  uptime_pct?: number;
}

export type HealthStatusResult = "success" | "warn" | "error" | "neutral";

export function getHealthStatus(metrics: HealthMetrics): HealthStatusResult {
  if (!metrics || Object.keys(metrics).length === 0) return "neutral";

  const { error_rate_p95 = 0, staleness_s = 0, uptime_pct = 100 } = metrics;

  if (error_rate_p95 > 0.02) return "error";
  if (error_rate_p95 > 0.01) return "warn";

  if (staleness_s > 120) return "error";
  if (staleness_s > 60) return "warn";

  if (uptime_pct < 94) return "error";
  if (uptime_pct < 99) return "warn";

  return "success";
}

export function mapStatus(status: string): HealthStatusResult {
  const s = (status || "").toLowerCase();
  if (s === "healthy") return "success";
  if (s === "degraded") return "warn";
  if (s === "outage") return "error";
  return "neutral";
}

export async function fetchJson(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
