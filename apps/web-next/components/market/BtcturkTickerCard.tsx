"use client";
import React from "react";
import { useBtcturkStore } from "@/stores/useBtcturkStore";

function fmt(n: number) {
  try {
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}

export default function BtcturkTickerCard() {
  const { status, ticker, lastUpdate, symbol, wsStatus, wsLatency, wsEnabled, feedMode } = useBtcturkStore((s) => ({
    status: s.status,
    ticker: s.ticker,
    lastUpdate: s.lastUpdate,
    symbol: s.symbol,
    wsStatus: s.wsStatus,
    wsLatency: s.wsLatency,
    wsEnabled: s.wsEnabled,
    feedMode: s.feedMode,
  }));

  return (
    <div className="rounded-2xl shadow-md p-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{symbol} • BTCTurk</div>
        <div className="flex items-center gap-2">
          {wsEnabled && <WSStatusPill status={wsStatus} latency={wsLatency} />}
          <StatusPill status={status} feedMode={feedMode} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4">
        <Metric label="Last" value={ticker ? fmt(ticker.last) : "—"} />
        <Metric label="Bid" value={ticker ? fmt(ticker.bid) : "—"} />
        <Metric label="Ask" value={ticker ? fmt(ticker.ask) : "—"} />
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        {lastUpdate ? `Güncellendi: ${new Date(lastUpdate).toLocaleTimeString("tr-TR")}` : "Bekleniyor..."}
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

function WSStatusPill({ status, latency }: { status: "OPEN" | "CLOSED" | "DEGRADED"; latency: number }) {
  const colors = {
    OPEN: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    DEGRADED: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    CLOSED: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
  };
  
  const text = status === "OPEN" ? "WS" : status === "DEGRADED" ? "WS!" : "WS✗";
  const title = `${status}${latency > 0 ? ` (${latency}ms)` : ""}`;
  
  return (
    <span 
      className={`px-2 py-1 rounded-full text-xs border ${colors[status]}`}
      title={title}
    >
      {text}
    </span>
  );
}

function StatusPill({ status, feedMode }: { status: "idle" | "loading" | "open" | "degraded"; feedMode: "ws" | "polling" }) {
  const liveBadge = feedMode === "ws" ? "Canlı (ws)" : "Canlı (mock)";
  const text =
    status === "loading" ? "Bağlanıyor" :
    status === "open" ? liveBadge :
    status === "degraded" ? liveBadge :
    (status as any) === "error" ? "Hata" : "Hazır";
  return (
    <span className="px-2 py-1 rounded-full text-xs border border-zinc-200 dark:border-zinc-700">
      {text}
    </span>
  );
}
