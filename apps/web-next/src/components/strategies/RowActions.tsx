"use client";
import { Strategy } from "@/types/strategy";
import { confirm } from "@/lib/confirm";

export default function RowActions({ strategy, onChange }: { strategy: Strategy; onChange: () => void }) {
  const start = async () => {
    const ok = await confirm("Stratejiyi başlat?", `${strategy.name} (${strategy.symbol})`);
    if (!ok) return;
    const r = await fetch("/api/exec/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: strategy.id }),
    });
    if (r.ok) onChange();
  };

  const stop = async () => {
    const ok = await confirm("Stratejiyi durdur?", strategy.name);
    if (!ok) return;
    const r = await fetch("/api/exec/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: strategy.id }),
    });
    if (r.ok) onChange();
  };

  const del = async () => {
    const ok = await confirm("Silmek istediğine emin misin?", "Bu işlem geri alınamaz.");
    if (!ok) return;
    const r = await fetch(`/api/strategies/${strategy.id}`, { method: "DELETE" });
    if (r.ok) onChange();
  };

  return (
    <div className="flex gap-2">
      {strategy.status === "running" ? (
        <button className="px-2 py-1 rounded-lg bg-orange-500 text-white" onClick={stop}>
          Durdur
        </button>
      ) : (
        <button className="px-2 py-1 rounded-lg bg-emerald-600 text-white" onClick={start}>
          Başlat
        </button>
      )}
      <button
        className="px-2 py-1 rounded-lg bg-neutral-200"
        onClick={() => location.assign(`/strategy-lab?id=${strategy.id}`)}
      >
        Düzenle
      </button>
      <button className="px-2 py-1 rounded-lg bg-red-600 text-white" onClick={del}>
        Sil
      </button>
    </div>
  );
}
