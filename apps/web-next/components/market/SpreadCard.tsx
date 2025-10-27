"use client";
import React from "react";
import { useBtcturkStore } from "@/stores/useBtcturkStore";

function fmt(n: number, opts: Intl.NumberFormatOptions = {}) {
  try { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2, ...opts }).format(n); }
  catch { return String(n); }
}

export default function SpreadCard() {
  const { ticker } = useBtcturkStore((s) => ({ ticker: s.ticker }));
  const bid = ticker?.bid ?? 0;
  const ask = ticker?.ask ?? 0;
  const mid = (bid && ask) ? (bid + ask) / 2 : 0;
  const spread = (ask && bid) ? (ask - bid) : 0;
  const bps = (mid > 0) ? (spread / mid) * 10000 : 0;

  return (
    <div className="rounded-2xl shadow-md p-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Spread</div>
        <div className="text-xs text-zinc-500">Top-of-book</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <Metric label="Bid" value={bid ? fmt(bid) : "—"} />
        <Metric label="Ask" value={ask ? fmt(ask) : "—"} />
        <Metric label="Spread" value={mid ? `${fmt(spread)} (${fmt(bps, { maximumFractionDigits: 1 })} bps)` : "—"} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
