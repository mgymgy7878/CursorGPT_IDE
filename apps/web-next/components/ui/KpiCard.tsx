import React from "react";

export default function KpiCard({
  title,
  value,
  hint,
  bad = false,
  good = false,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
  bad?: boolean;
  good?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        bad ? "border-red-700/60 bg-red-900/10" : good ? "border-emerald-700/60 bg-emerald-900/10" : "border-neutral-800 bg-neutral-900/30"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-neutral-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-neutral-400">{hint}</div> : null}
    </div>
  );
} 