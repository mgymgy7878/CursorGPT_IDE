"use client";
import { useEffect, useState } from "react";

type Metrics = { 
  p95_ms?: number; 
  staleness_s?: number; 
  error_rate?: number; 
  _err?: string; 
  _offline?: boolean;
  retryAfter?: string;
};

export default function MarketsWidget() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch gerçek executor metrics via proxy
    (async () => {
      try {
        const r = await fetch("/api/tools/get_metrics", { cache: "no-store" as any });
        const data = await r.json();
        setM({ 
          p95_ms: data.p95_ms ?? 0, 
          staleness_s: data.staleness_s ?? 0, 
          error_rate: data.error_rate ?? 0,
          _err: data._err,
          _offline: !!data._err,
          retryAfter: data.retryAfter
        });
      } catch {
        setM({ p95_ms: 0, staleness_s: 0, error_rate: 0, _err: "network_error", _offline: true, retryAfter: undefined });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="mb-2 font-medium flex items-center gap-2">
        Markets Health
        {m?._err && (
          <span className={`px-2 py-1 text-xs text-white rounded-full ${
            m._err.includes('429') ? 'bg-amber-600' : 
            m._err.includes('fetch failed') || m._err.includes('aborted') ? 'bg-red-600' : 
            'bg-red-600'
          }`} title={`Error: ${m._err}`}>
            {m._err.includes('429') ? 'rate-limited' : 'executor: offline'}
            {m.retryAfter && ` (${m.retryAfter}s)`}
          </span>
        )}
        {m?.staleness_s && m.staleness_s > 60 && !m._offline && (
          <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">
            stale {Math.round(m.staleness_s)}s
          </span>
        )}
      </div>
      {loading ? <div className="h-6 w-32 animate-pulse rounded bg-neutral-800" /> : (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Card label="P95 (ms)" value={m?.p95_ms ?? 0} offline={m?._offline} err={m?._err} />
          <Card label="Staleness (s)" value={m?.staleness_s ?? 0} offline={m?._offline} err={m?._err} />
          <Card label="Error rate" value={m?.error_rate ?? 0} offline={m?._offline} err={m?._err} />
        </div>
      )}
    </div>
  );
}

function Card({ label, value, offline, err }: { label: string; value: number; offline?: boolean; err?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 p-3" title={offline ? `Error: ${err}` : undefined}>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-lg font-semibold">
        {offline ? "—" : value}
      </div>
    </div>
  );
}

