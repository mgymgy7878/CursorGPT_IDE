"use client";
import { useEffect } from "react";
import { useBtcturkHisseStore } from "@/stores/useBtcturkHisseStore";
import BistTickerCard from "@/components/market/BistTickerCard";

export default function BistPage() {
  const { start, stop, setSymbol, symbol } = useBtcturkHisseStore();
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-100">Borsa İstanbul</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Sembol</span>
          <select
            className="bg-slate-800 text-slate-100 rounded px-3 py-2 border border-slate-700"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            <option value="ISCTR.E">ISCTR.E</option>
            <option value="THYAO.E">THYAO.E</option>
            <option value="ASELS.E">ASELS.E</option>
          </select>
        </div>
      </div>
      <BistTickerCard />
    </div>
  );
}


