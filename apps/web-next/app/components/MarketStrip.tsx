"use client";
import { useEffect, useState } from "react";

type Row = { s:string; p:number; ch:number; h:number; l:number; v:number };

export default function MarketStrip() {
  const [rows,setRows] = useState<Row[]>([]);
  const [err,setErr]   = useState<string>("");
  useEffect(()=>{
    let alive = true;
    const pull = async ()=>{
      try {
        const r = await fetch("/api/market/summary");
        const j = await r.json();
        if (alive && j.ok) setRows(j.symbols);
      } catch(e:any){ if(alive) setErr("market_fetch_failed"); }
    };
    pull(); const t = setInterval(pull, 15000);
    return ()=>{ alive=false; clearInterval(t); };
  },[]);
  if (err) return <div className="text-xs text-red-400">Piyasa verisi alınamadı.</div>;
  if (!rows.length) return <div className="text-xs text-neutral-400">Piyasa verisi yükleniyor…</div>;
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-6 py-2 text-sm">
        {rows.map(r=>{
          const pos = r.ch >= 0;
          return (
            <div key={r.s} className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-semibold text-neutral-200">{r.s}</span>
              <span className="tabular-nums text-neutral-300">{r.p.toLocaleString()}</span>
              <span className={pos ? "text-emerald-400" : "text-rose-400"}>
                {pos ? "▲" : "▼"} {r.ch.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
