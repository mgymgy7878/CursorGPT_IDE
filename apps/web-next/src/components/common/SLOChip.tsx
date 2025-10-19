"use client";
import { useEffect, useState } from "react";
import { fmtNumberTR } from "@/lib/ui/format";
import { SLO_TARGETS } from "@/lib/constants/slo";

type Metrics = {
  p95_ms: number;
  staleness_s: number;
  error_rate: number;
  _err?: string;
  _offline?: boolean;
  retryAfter?: string;
};

type LastCanary = {
  status: "ok" | "err";
  timestamp: number;
  jobId: string;
};

const TARGETS = {
  p95_ms: SLO_TARGETS.P95_MS,
  staleness_s: SLO_TARGETS.STALENESS_S,
  error_rate: SLO_TARGETS.ERROR_RATE
};

export default function SLOChip() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCanary, setLastCanary] = useState<LastCanary | null>(null);

  useEffect(() => {
    loadMetrics();
    loadLastCanary();
    const interval = setInterval(() => {
      loadMetrics();
      loadLastCanary();
    }, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      const res = await fetch("/api/tools/get_metrics", {
        cache: "no-store"
      });
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      setMetrics({
        p95_ms: 0,
        staleness_s: 0,
        error_rate: 0,
        _err: "fetch_failed",
        _offline: true
      });
    } finally {
      setLoading(false);
    }
  }
  
  function loadLastCanary() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("lastCanary");
        if (stored) {
          setLastCanary(JSON.parse(stored));
        }
      } catch {
        setLastCanary(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 p-3 bg-neutral-900/50">
        <div className="animate-pulse">
          <div className="h-4 w-20 bg-neutral-800 rounded mb-2"></div>
          <div className="space-y-1">
            <div className="h-3 w-16 bg-neutral-800 rounded"></div>
            <div className="h-3 w-12 bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-xl border border-red-800 p-3 bg-red-900/20">
        <div className="text-red-400 text-sm font-medium">SLO Hatası</div>
        <div className="text-xs text-red-300">Veri yok</div>
      </div>
    );
  }

  const isOffline = metrics._offline || metrics._err;
  const isStale = metrics.staleness_s > TARGETS.staleness_s;
  const isSlow = metrics.p95_ms > TARGETS.p95_ms;
  const isErrorHigh = metrics.error_rate > TARGETS.error_rate;

  const overallStatus = isOffline ? "offline" : 
                       (isErrorHigh || isStale || isSlow) ? "warning" : "ok";

  return (
    <div className={`rounded-xl border p-3 ${
      overallStatus === "offline" ? "border-red-800 bg-red-900/20" :
      overallStatus === "warning" ? "border-yellow-800 bg-yellow-900/20" :
      "border-green-800 bg-green-900/20"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-sm font-medium ${
          overallStatus === "offline" ? "text-red-400" :
          overallStatus === "warning" ? "text-yellow-400" :
          "text-green-400"
        }`}>
          {overallStatus === "offline" ? "🔴 SLO Offline" :
           overallStatus === "warning" ? "🟡 SLO Warning" :
           "🟢 SLO OK"}
        </span>
        {metrics.retryAfter && (
          <span className="text-xs text-yellow-400">
            Retry: {metrics.retryAfter}s
          </span>
        )}
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-neutral-400">P95:</span>
          <span className={`font-mono ${
            isSlow ? "text-yellow-400" : "text-neutral-300"
          }`}>
            {isOffline ? "—" : fmtNumberTR(metrics.p95_ms)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Stale:</span>
          <span className={`font-mono ${
            isStale ? "text-yellow-400" : "text-neutral-300"
          }`}>
            {isOffline ? "—" : fmtNumberTR(metrics.staleness_s)}s
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Error:</span>
          <span className={`font-mono ${
            isErrorHigh ? "text-yellow-400" : "text-neutral-300"
          }`}>
            {isOffline ? "—" : (metrics.error_rate * 100).toFixed(2)}%
          </span>
        </div>
        {lastCanary && (
          <div className="flex justify-between pt-1 border-t border-neutral-700">
            <span className="text-neutral-400">Canary:</span>
            <span className={`font-mono ${
              lastCanary.status === "ok" ? "text-green-400" : "text-red-400"
            }`}>
              {lastCanary.status === "ok" ? "✓" : "✗"} {Math.floor((Date.now() - lastCanary.timestamp) / 1000)}s
            </span>
          </div>
        )}
      </div>

      {metrics._err && (
        <div className="mt-2 text-xs text-red-400 truncate" title={metrics._err}>
          {metrics._err}
        </div>
      )}
    </div>
  );
}
