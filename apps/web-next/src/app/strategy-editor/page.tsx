"use client";

import { useState } from "react";

export default function StrategyEditorPage(){
  const [code,setCode]=useState<string>(`export function signal({ o,h,l,c }) {
  // örnek: EMA50 üstünde ise long
  return c > o ? 'long' : 'flat';
}`);
  const [result,setResult]=useState<any>(null);
  const [loading,setLoading]=useState(false);

  async function validate(){
    setLoading(true);
    try{
      const r = await fetch('/api/copilot/action',{
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body: JSON.stringify({ action:'strategy/validate', params:{ code } })
      });
      setResult(await r.json());
    }finally{ setLoading(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">🧩 Strateji Editörü</h1>
        <p className="text-xs opacity-70">Basit JS strateji şablonları ile deneyin</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <textarea value={code} onChange={e=>setCode(e.target.value)} className="w-full h-64 p-3 rounded-xl bg-black/40 border border-neutral-800 font-mono text-sm"/>
        <div className="rounded-xl border border-neutral-800 p-3 bg-black/20">
          <div className="text-sm opacity-70 mb-2">Sonuç</div>
          <pre className="text-xs overflow-auto max-h-64">{result? JSON.stringify(result,null,2): '—'}</pre>
        </div>
      </div>
      <button onClick={validate} disabled={loading} className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50">{loading?'⏳ Doğrulanıyor...':'✅ Doğrula'}</button>
    </div>
  );
}


