"use client";

import dynamic from "next/dynamic";
import TopNTable from "@/components/optimize/TopNTable";

const ScoreChart = dynamic(() => import("@/components/optimize/ScoreChart"), { ssr: false });

export default function OptimizePage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Optimize</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TopNTable limit={12} />
          <ScoreChart />
        </div>
        <div>
          <MetricsQuickView />
        </div>
      </div>
    </div>
  );
}

function MetricsQuickView() {
  async function fetchMetrics(): Promise<string> {
    const r = await fetch("/api/public/metrics/prom");
    return await r.text();
  }

  async function openMetrics() {
    const text = await fetchMetrics();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "metrics.prom"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-3 rounded-lg border border-gray-700 bg-gray-900">
      <div className="text-sm font-semibold mb-2">Prometheus Hızlı Görünüm</div>
      <p className="text-xs text-gray-400 mb-2">spark_futures_* sayaçlarını anlık çek</p>
      <button className="px-3 py-2 rounded bg-gray-700 text-white text-sm" onClick={openMetrics}>Metriği İndir</button>
    </div>
  );
}


