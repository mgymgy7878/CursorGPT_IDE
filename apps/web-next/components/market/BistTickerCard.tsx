"use client";
import { useBtcturkHisseStore } from "@/stores/useBtcturkHisseStore";

export default function BistTickerCard() {
  const { ticker, status, feedMode } = useBtcturkHisseStore();
  return (
    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-200 font-semibold">BIST • BTCTurk Hisse</h3>
        <span className={`text-xs px-2 py-1 rounded ${feedMode === "ws" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
          {feedMode === "ws" ? "Canlı (ws)" : "Canlı (mock)"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Metric label="Last" value={ticker?.last} />
        <Metric label="Bid" value={ticker?.bid} />
        <Metric label="Ask" value={ticker?.ask} />
      </div>
      <div className="text-xs text-slate-400 mt-2">Durum: {status.toUpperCase()} • {ticker?.ts ? new Date(ticker.ts).toLocaleTimeString() : "-"}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="p-3 rounded-xl bg-slate-900/60">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-slate-100 text-xl">{value?.toLocaleString("tr-TR") ?? "—"}</div>
    </div>
  );
}


