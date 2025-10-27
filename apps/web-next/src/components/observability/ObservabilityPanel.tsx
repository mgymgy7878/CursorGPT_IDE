// apps/web-next/src/components/observability/ObservabilityPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTimeseries } from "@/hooks/useTimeseries";
import MiniMetric from "./MiniMetric";
import type { MetricsSummary, ServiceHealth } from "@/types/metrics";

export default function ObservabilityPanel() {
  const { points: p95Series, latest: p95 } = useTimeseries<number>({
    url: "/api/metrics/summary",
    getter: (j: MetricsSummary) => Number(j?.p95_ms ?? 0),
    intervalMs: 10_000,
    maxPoints: 120,
    persistKey: "obs:p95",
  });

  const { points: errSeries, latest: errRate } = useTimeseries<number>({
    url: "/api/metrics/summary",
    getter: (j: MetricsSummary) => Number(j?.error_rate ?? 0),
    intervalMs: 10_000,
    maxPoints: 120,
    persistKey: "obs:err",
  });

  const [health, setHealth] = useState<ServiceHealth | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/services/health", { cache: "no-store" });
        const json = (await r.json()) as ServiceHealth;
        if (alive) setHealth(json);
      } catch { /* ignore */ }
    })();
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/services/health", { cache: "no-store" });
        const json = (await r.json()) as ServiceHealth;
        if (alive) setHealth(json);
      } catch {}
    }, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const svcStats = useMemo(() => {
    const list = Object.values(health ?? {});
    const up = list.filter(s => s.ok).length;
    const total = list.length || 0;
    return { up, total };
  }, [health]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">Observability</div>
      <div className="grid gap-3 md:grid-cols-3">
        <MiniMetric title="P95 Latency" value={p95} unit="ms" points={p95Series} goodWhenLower />
        <MiniMetric title="Error Rate" value={errRate} unit="%" points={errSeries} goodWhenLower />
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-xs text-gray-500">Services</div>
          <div className="mt-1 text-xl font-semibold">
            {svcStats.up} / {svcStats.total} <span className="text-sm text-gray-500">healthy</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.values(health ?? {}).map(s => (
              <span
                key={s.name}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${s.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                title={s.error || ""}
              >
                <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${s.ok ? "bg-green-600" : "bg-red-600"}`} />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
