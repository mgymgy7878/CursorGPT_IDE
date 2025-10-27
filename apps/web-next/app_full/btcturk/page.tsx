"use client";
import React, { useEffect } from "react";
import BtcturkTickerCard from "@/components/market/BtcturkTickerCard";
import { useBtcturkStore } from "@/stores/useBtcturkStore";
import SystemHealthPill from "@/components/system/SystemHealthPill";
import SpreadCard from "@/components/market/SpreadCard";

export default function BtcturkPage() {
  const { start, stop, setSymbol, symbol } = useBtcturkStore((s) => ({
    start: s.start, stop: s.stop, setSymbol: s.setSymbol, symbol: s.symbol
  }));

  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">BTCTurk Market</h1>
        <div className="ml-auto"><SystemHealthPill /></div>
        <span className="text-sm text-zinc-500">Sembol:</span>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border rounded-lg px-2 py-1 bg-white dark:bg-zinc-900"
        >
          <option value="BTCTRY">BTCTRY</option>
          <option value="ETHTRY">ETHTRY</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <BtcturkTickerCard />
        </div>
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <SpreadCard />
          <div className="rounded-2xl border border-dashed p-6 text-sm text-zinc-500">Order Book (yakında)</div>
          <div className="rounded-2xl border border-dashed p-6 text-sm text-zinc-500">Derinlik Grafiği / Candlestick (yakında)</div>
        </div>
      </div>
    </div>
  );
}
