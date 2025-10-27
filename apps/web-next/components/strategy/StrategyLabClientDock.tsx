"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import SideChatPanel from "@/components/common/SideChatPanel";
const SavedStrategies = dynamic(()=>import('@/components/lab/SavedStrategies').then(m=>m.default),{ ssr:false });
const CodeEditor = dynamic(()=>import('@/components/editor/CodeEditor').then(m=>m.default),{ ssr:false });

export default function StrategyLabClientDock() {
  const [runBusy, setRunBusy] = useState(false);
  const [optBusy, setOptBusy] = useState(false);
  async function startBacktest() {
    setRunBusy(true);
    try {
      await fetch('/api/public/backtest/run', { method:'POST', cache:'no-store', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode:'job', source:'lab-ui' }) });
    } finally { setRunBusy(false); }
  }
  async function startOptimize() {
    setOptBusy(true);
    try {
      await fetch('/api/public/lab/chat', { method:'POST', cache:'no-store', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messages:[{ role:'user', content:'Optimize strategy params for better Sharpe. Return param grid.'}] }) });
    } finally { setOptBusy(false); }
  }
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto p-2 space-y-4">
        <div className="border border-zinc-800 rounded-lg p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-zinc-300">Strategy Editor</div>
            <div className="flex items-center gap-2">
              <button onClick={startBacktest} disabled={runBusy} className="px-2 py-1 rounded border border-emerald-700 text-emerald-300 disabled:opacity-50 hover:bg-emerald-900/20" title="Editor'deki stratejiyi backtest olarak çalıştır">Run Backtest</button>
              <button onClick={startOptimize} disabled={optBusy} className="px-2 py-1 rounded border border-sky-700 text-sky-300 disabled:opacity-50 hover:bg-sky-900/20" title="Basit param optimizasyonu talep et">Optimize (AI)</button>
            </div>
          </div>
          <CodeEditor value="" onChange={() => {}} />
        </div>
        <SavedStrategies />
      </div>
      <SideChatPanel
        title="Lab AI (Kod & Backtest)"
        storageKey="ai:lab:thread"
        apiPath="/api/public/lab/chat"
        placeholder="Strateji isteğini yazın, kodu analiz ettirin, hatayı çözdürün…"
        headerExtra={<span className="text-[10px] text-zinc-500">Editor ve Lab UI’den bağımsız oturum</span>}
        templates={[
          { label:'Kod analizi', prompt:'Aşağıdaki strateji kodunu statik olarak analiz et, hataları ve edge-case’leri listele:' },
          { label:'Hata düzelt', prompt:'Bu hata için minimal patch öner: ' },
          { label:'Backtest iste', prompt:'Şu parametrelerle backtest başlat (TF=5m, SL=2%, TP=4%, fee=0.08%): ' },
          { label:'Optimize et', prompt:'Sharpe>1.5 hedefiyle param grid öner ve en iyi 3 aday için beklenen metrikleri yaz.' },
        ]}
      />
    </div>
  );
} 