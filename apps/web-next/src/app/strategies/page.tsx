"use client";
import useSWR from "swr";
import { useState, useMemo } from "react";
import { Strategy } from "@/types/strategy";
import StrategyTable from "@/components/strategies/StrategyTable";
import EmptyState from "@/components/strategies/EmptyState";
import { fetcher } from "@/lib/api";

export default function StrategiesPage() {
  const { data, isLoading, mutate } = useSWR<Strategy[]>("/api/strategies", fetcher, { refreshInterval: 30000 });
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => (data || []).filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.symbol.toLowerCase().includes(q.toLowerCase())),
    [data, q]
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stratejilerim</h1>
          <p className="text-sm opacity-70">Oluştur, başlat, durdur ve yönet.</p>
        </div>
        <button
          className="px-3 py-2 rounded-xl bg-blue-600 text-white"
          onClick={async () => {
            const r = await fetch("/api/strategies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Yeni Strateji", symbol: "BTCUSDT", code: "# write here" }),
            });
            if (r.ok) mutate();
          }}
        >
          + Yeni Strateji
        </button>
      </div>

      <div className="flex gap-2">
        <input
          placeholder="Ara: ad veya sembol"
          className="w-full rounded-xl border px-3 py-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="animate-pulse h-48 rounded-2xl border" />
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => document.querySelector<HTMLButtonElement>("button")?.click()} />
      ) : (
        <StrategyTable rows={filtered} onChange={() => mutate()} />
      )}
    </div>
  );
}
