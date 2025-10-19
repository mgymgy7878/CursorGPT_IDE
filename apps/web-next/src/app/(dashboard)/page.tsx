"use client";
export const dynamic = 'force-dynamic';
import React from "react";
import AppShell from "@/components/layout/AppShell";
import MarketProvider from "../../providers/MarketProvider";
import { MarketCard } from "../../components/market/MarketCard";
import { useMarketStore } from "@/stores/marketStore";

const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","AVAXUSDT","DOGEUSDT","DOTUSDT"];

export default function DashboardPage(){
  return (
    <AppShell>
      <MarketProvider>
        <Grid />
      </MarketProvider>
    </AppShell>
  );
}

function Grid(){
  const ws = useMarketStore(s => s.wsReconnectTotal);
  return (
    <div className="space-y-3">
      <div className="text-xs text-neutral-400">WS reconnects: <span className="font-semibold text-neutral-200">{ws}</span></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {symbols.map(s => <MarketCard key={s} symbol={s} />)}
      </div>
    </div>
  );
}


