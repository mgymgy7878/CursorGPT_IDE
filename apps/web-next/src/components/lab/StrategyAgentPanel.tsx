'use client';
import { useState } from 'react';

export default function StrategyAgentPanel({ spec, onApply, onBacktest }:{ spec:any; onApply:(code:string)=>void; onBacktest:()=>void }){
  const [prompt,setPrompt]=useState('RSI crossover');
  const [loading,setLoading]=useState(false);
  async function ask(){
    setLoading(true);
    try{
      const r = await fetch('/api/ai/strategy', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ prompt, context:{ name: spec?.name } }) });
      const j = await r.json().catch(()=>({}));
      if(j?.patch?.code){ onApply(j.patch.code); }
    }finally{ setLoading(false); }
  }
  return (
    <div className="border border-neutral-800 rounded-2xl p-3">
      <div className="font-semibold mb-2">Strategy Botu (AI)</div>
      <textarea className="w-full h-24 px-2 py-1 rounded border border-neutral-800 bg-black" value={prompt} onChange={e=>setPrompt(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button className="btn" onClick={ask} disabled={loading}>{loading? 'Üretiliyor…':'Öneri Üret'}</button>
        <button className="btn" onClick={onBacktest}>Try Backtest</button>
      </div>
    </div>
  );
}


