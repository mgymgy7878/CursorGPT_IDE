"use client";
import { RunningStrategy } from "@/types/strategy";
import RunningCard from "./RunningCard";

export default function RunningList({
  rows,
  series,
  onChanged,
}: {
  rows: RunningStrategy[];
  series: Record<string, { ts: number; pnl: number }[]>;
  onChanged: () => void;
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-2xl border p-10 text-center">
        <h3 className="text-lg font-semibold">Aktif strateji yok</h3>
        <p className="opacity-70">/strategies sayfasından başlatabilirsin.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((s) => (
        <RunningCard key={s.id} s={s} data={series[s.id] || []} onChanged={onChanged} />
      ))}
    </div>
  );
}
