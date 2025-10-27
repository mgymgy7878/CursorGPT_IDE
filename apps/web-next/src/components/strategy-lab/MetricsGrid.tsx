// apps/web-next/src/components/strategy-lab/MetricsGrid.tsx
"use client";
import type { BacktestMetrics } from "@/types/backtest";

export default function MetricsGrid({ m }: { m: BacktestMetrics }) {
  const items = [
    { k: "Toplam Getiri", v: `${fmt(m.totalReturnPct)}%` },
    { k: "Sharpe", v: m.sharpe.toFixed(2) },
    { k: "Max DD", v: `${fmt(m.maxDrawdownPct)}%` },
    { k: "Win Rate", v: `${fmt(m.winRatePct)}%` },
    { k: "İşlem", v: m.trades.toString() },
    { k: "Ort. İşlem", v: `${fmt(m.avgTradePct)}%` },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((x) => (
        <div key={x.k} className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">{x.k}</div>
          <div className="text-lg font-semibold">{x.v}</div>
        </div>
      ))}
    </div>
  );
}
const fmt = (n: number) => Number.isFinite(n) ? n.toFixed(2) : "-";
