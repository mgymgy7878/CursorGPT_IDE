"use client";
import { useEffect, useState } from "react";
export default function CopilotSummaryModal({ open, onClose }:{ open:boolean; onClose:()=>void }){
  const [data,setData]=useState<any|null>(null);
  const [tab,setTab]=useState<"strategies"|"orders"|"alerts">("strategies");
  useEffect(()=>{ if(open){ fetch("/api/copro/summary",{method:"POST",headers:{"content-type":"application/json"},body:"{}"})
    .then(r=>r.json()).then(setData).catch(()=>setData(null)); } },[open]);
  if(!open) return null;
  const s = data?.sample?.strategies ?? [];
  const o = data?.sample?.orders ?? [];
  const a = data?.sample?.alerts ?? [];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card p-4" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Canlı Özet — Detay</h3>
          <button className="btn" onClick={onClose}>Kapat</button>
        </div>
        <div className="tabs mt-3">
          <button className={`tab ${tab==="strategies"?"active":""}`} onClick={()=>setTab("strategies")}>Stratejiler</button>
          <button className={`tab ${tab==="orders"?"active":""}`} onClick={()=>setTab("orders")}>Emirler</button>
          <button className={`tab ${tab==="alerts"?"active":""}`} onClick={()=>setTab("alerts")}>Uyarılar</button>
        </div>
        <div className="mt-3 overflow-x-auto">
          {tab==="strategies" && <pre className="pre">{JSON.stringify(s,null,2)}</pre>}
          {tab==="orders" && <pre className="pre">{JSON.stringify(o,null,2)}</pre>}
          {tab==="alerts" && <pre className="pre">{JSON.stringify(a,null,2)}</pre>}
        </div>
      </div>
    </div>
  );
}


