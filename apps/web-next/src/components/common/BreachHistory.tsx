"use client";
import { useEffect, useState } from "react";

type Breach = {
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
  severity: "warning" | "critical";
  duration?: number;
};

type Props = {
  hours?: number;
};

export default function BreachHistory({ hours = 24 }: Props) {
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "warning" | "critical">("all");

  useEffect(() => {
    loadBreaches();
  }, [hours, filter]);

  async function loadBreaches() {
    try {
      const severityParam = filter !== "all" ? `&severity=${filter}` : '';
      const res = await fetch(`/api/tools/metrics/breaches?hours=${hours}${severityParam}`, {
        cache: "no-store"
      });
      const data = await res.json();
      setBreaches(data.breaches || []);
    } catch (e) {
      setBreaches([]);
    } finally {
      setLoading(false);
    }
  }

  function formatMetric(metric: string) {
    const map: Record<string, string> = {
      p95_ms: "P95 Latency",
      staleness_s: "Staleness",
      error_rate: "Error Rate"
    };
    return map[metric] || metric;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-neutral-800 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-neutral-800 rounded w-full"></div>
            <div className="h-3 bg-neutral-800 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">📋 İhlal Geçmişi ({hours}h)</h3>
        <div className="flex gap-1">
          {(["all", "warning", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2 py-0.5 rounded ${
                filter === f 
                  ? f === "critical" ? "bg-red-500 text-white" : f === "warning" ? "bg-yellow-500 text-black" : "bg-blue-500 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {f === "all" ? "Tümü" : f === "warning" ? "Uyarı" : "Kritik"}
            </button>
          ))}
        </div>
      </div>

      {breaches.length === 0 ? (
        <div className="text-center py-6 text-neutral-500 text-xs">
          ✓ İhlal kaydı yok ({hours}h)
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {breaches.map((breach, idx) => (
            <div
              key={idx}
              className={`p-2 rounded border ${
                breach.severity === "critical"
                  ? "bg-red-950/30 border-red-800/50"
                  : "bg-yellow-950/30 border-yellow-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${
                  breach.severity === "critical" ? "text-red-400" : "text-yellow-400"
                }`}>
                  {breach.severity === "critical" ? "🚨" : "⚠️"} {formatMetric(breach.metric)}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(breach.timestamp).toLocaleTimeString('tr-TR')}
                </span>
              </div>
              <div className="text-xs text-neutral-400">
                Değer: {breach.value.toFixed(2)} &gt; Eşik: {breach.threshold.toFixed(2)}
                {breach.duration && ` · ${Math.floor(breach.duration / 60)}m ${breach.duration % 60}s`}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-neutral-800 text-center text-xs text-neutral-500">
        Toplam {breaches.length} ihlal ({hours} saat içinde)
      </div>
    </div>
  );
}

