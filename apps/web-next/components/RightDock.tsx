'use client';
import { useState, useEffect } from "react";
import StrategyAIDock from "@/components/ai/StrategyAIDock";
import TraderAIDock from "@/components/ai/TraderAIDock";

export default function RightDock() {
  const [tab, setTab] = useState<'trader' | 'strategy'>('trader');

  // responsive: <lg gizle, lg+ göster. İstersen store ile kalıcı ayar yap.
  return (
    <aside className="hidden lg:flex fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-[380px] border-l border-zinc-800 bg-zinc-900/70 backdrop-blur-sm">
      <div className="flex flex-col w-full h-full">
        <div className="flex border-b border-zinc-800">
          <button
            className={`px-4 py-2 text-sm ${tab==='trader' ? 'bg-zinc-800' : ''}`}
            onClick={()=>setTab('trader')}
            title="Piyasa özeti, risk, komutlar"
          >Trader AI</button>
          <button
            className={`px-4 py-2 text-sm ${tab==='strategy' ? 'bg-zinc-800' : ''}`}
            onClick={()=>setTab('strategy')}
            title="Kod üret/analiz, backtest/optimizasyon"
          >Strategy AI</button>
          <div className="ml-auto p-2 text-xs text-zinc-400">⌘/Ctrl+Enter: Gönder</div>
        </div>
        <div className="flex-1 overflow-auto">
          {tab==='trader' ? <TraderAIDock/> : <StrategyAIDock/>}
        </div>
      </div>
    </aside>
  );
} 