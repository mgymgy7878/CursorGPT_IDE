// apps/web-next/src/components/observability/MiniMetric.tsx
"use client";

import Sparkline from "./Sparkline";

export default function MiniMetric({
  title,
  value,
  unit,
  points,
  goodWhenLower = false, // latency iyi ise ↓
}: {
  title: string;
  value: number | string | undefined;
  unit?: string;
  points: { t: number; v: number }[];
  goodWhenLower?: boolean;
}) {
  const last = points.at(-1)?.v as number | undefined;
  const prev = points.length > 1 ? (points.at(-2)?.v as number) : undefined;
  const delta = last != null && prev != null ? last - prev : undefined;

  const trendUpGood = !goodWhenLower; // error_rate için false → up kötü
  const trendGood = delta != null ? (trendUpGood ? delta >= 0 : delta < 0) : undefined;

  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-xl font-semibold">
            {format(value)}
            {unit ? <span className="ml-1 text-sm text-gray-500">{unit}</span> : null}
          </div>
          {delta != null && (
            <div className={`mt-0.5 text-[11px] ${trendGood ? "text-green-600" : "text-red-600"}`}>
              {delta >= 0 ? "▲" : "▼"} {format(Math.abs(delta))}
              {unit ? unit : ""}
            </div>
          )}
        </div>
        <Sparkline
          data={points as any}
          positiveUpIsGood={trendUpGood}
        />
      </div>
    </div>
  );
}

function format(v: any) {
  if (v == null || Number.isNaN(v)) return "-";
  if (typeof v === "number") {
    if (Math.abs(v) >= 100) return Math.round(v);
    return v.toFixed(2);
  }
  return String(v);
}
