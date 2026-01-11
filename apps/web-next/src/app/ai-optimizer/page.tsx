"use client";

import { useState } from "react";

export default function AiOptimizerPage(){
  const [params,setParams]=useState({ emaFast:20, emaSlow:50 });
  const [running,setRunning]=useState(false);
  const [best,setBest]=useState<any>(null);

  async function optimize(){
    setRunning(true);
    try{
      const r = await fetch('/api/copilot/action',{
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body: JSON.stringify({ action:'optimize/ema', params })
      });
      setBest(await r.json());
    }finally{ setRunning(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">🤖 AI Optimizasyon</h1>
        <p className="text-xs opacity-70">Parametre taraması ile en iyi EMA kombinasyonunu bul</p>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        <label className="text-sm">
          <div>EMA Fast</div>
          <input type="number" value={params.emaFast} onChange={e=>setParams(p=>({ ...p, emaFast:+e.target.value }))} className="p-2 rounded bg-black/40 border border-neutral-800 w-full"/>
        </label>
        <label className="text-sm">
          <div>EMA Slow</div>
          <input type="number" value={params.emaSlow} onChange={e=>setParams(p=>({ ...p, emaSlow:+e.target.value }))} className="p-2 rounded bg-black/40 border border-neutral-800 w-full"/>
        </label>
      </div>
      <button onClick={optimize} disabled={running} className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50">{running?'⏳ Çalışıyor...':'🚀 Optimize Et'}</button>
      <div className="rounded-xl border border-neutral-800 p-3 bg-black/20">
        <div className="text-sm opacity-70 mb-2">Sonuç</div>
        <pre className="text-xs overflow-auto">{best? JSON.stringify(best,null,2): '—'}</pre>
      </div>
    </div>
  );
}


