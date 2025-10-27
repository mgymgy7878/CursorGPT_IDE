"use client";
import { useEffect, useMemo, useState } from "react";

type Item = { symbol: string; weight: number; pnl: number };
function clamp(n:number,min:number,max:number){ return Math.max(min, Math.min(max, n)); }

export default function Heatmap(){
  const [rows,setRows] = useState<Item[]>([]);
  const [mode,setMode] = useState<"weight"|"pnl">("pnl");

  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch("/api/public/manager/summary", { cache: "no-store" });
        const j = await r.json();
        const items:Item[] = (j?.data?.positions || j?.positions || []).map((p:any)=>({ symbol: p.symbol, weight: Number(p.weight||0), pnl: Number(p.pnl||0) }));
        setRows(items);
      }catch{}
    })();
  },[]);

  const sorted = useMemo(()=>{
    const arr = [...rows];
    arr.sort((a,b)=> mode==="weight" ? b.weight - a.weight : b.pnl - a.pnl);
    return arr.slice(0, 36);
  },[rows,mode]);

  return (
    <div className="p-3 rounded-2xl border bg-white shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Portfolio Heatmap</div>
        <div className="flex items-center gap-2 text-xs">
          <span>renk=pnl</span>
          <label className="inline-flex items-center gap-1"><input type="radio" checked={mode==="pnl"} onChange={()=>setMode("pnl")} />pnl</label>
          <label className="inline-flex items-center gap-1"><input type="radio" checked={mode==="weight"} onChange={()=>setMode("weight")} />weight</label>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {sorted.map((it, i)=>{
          const v = mode==="pnl" ? clamp(it.pnl, -0.2, 0.2) : clamp(it.weight, 0, 0.3);
          const bg = mode==="pnl"
            ? `hsl(${clamp((v+0.2)/0.4,0,1)*120} 70% 45%)`
            : `hsl(210 60% ${40 + (v/0.3)*30}%)`;
          return (
            <div key={i} title={`${it.symbol}\nweight=${(it.weight*100).toFixed(1)}%\npnl=${(it.pnl*100).toFixed(1)}%`}
                 className="aspect-square rounded-md text-[10px] flex items-center justify-center text-white"
                 style={{ background: bg }}>
              {it.symbol}
            </div>
          );
        })}
      </div>
    </div>
  );
} 