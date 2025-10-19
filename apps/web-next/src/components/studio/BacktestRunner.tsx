"use client";
import { useState } from "react";

export default function BacktestRunner(){
  const [res,setRes]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({ symbol:'BTCUSDT', timeframe:'1h', start:'2024-05-01', end:'2024-06-01' });

  async function run(){
    setLoading(true);
    try{
      const r=await fetch("/api/backtest/run",{ method:"POST", headers:{'content-type':'application/json'}, body: JSON.stringify(form)});
      setRes(await r.json().catch(()=>null));
    } finally { setLoading(false); }
  }

  return (
    <div className="card p-4 border border-neutral-800 rounded-xl bg-black/30">
      <h2 className="text-xl mb-2">Backtest</h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
        <input className="p-2 rounded bg-black/40 border border-neutral-800" value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})}/>
        <input className="p-2 rounded bg-black/40 border border-neutral-800" value={form.timeframe} onChange={e=>setForm({...form,timeframe:e.target.value})}/>
        <input className="p-2 rounded bg-black/40 border border-neutral-800" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/>
        <input className="p-2 rounded bg-black/40 border border-neutral-800" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/>
        <button onClick={run} disabled={loading} className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50">{loading?"Çalışıyor…":"Çalıştır"}</button>
      </div>
      {res && (
        <pre className="overflow-auto p-3 rounded bg-black/40 border border-neutral-800 text-xs">{JSON.stringify(res,null,2)}</pre>
      )}
    </div>
  );
}


