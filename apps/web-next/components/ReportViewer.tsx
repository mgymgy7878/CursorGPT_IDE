"use client";
import { useEffect, useState } from "react";

export default function ReportViewer(){
  const [data,setData] = useState<any>(null);
  async function load(){
    const r = await fetch("/api/private/report/latest"); if (r.ok) setData(await r.json());
  }
  useEffect(()=>{ load(); const t=setInterval(load, 15000); return ()=>clearInterval(t); },[]);
  if(!data) return <div className="p-3 border rounded-xl">No report yet</div>;
  const m = data.summary?.metrics || {};
  return (
    <div className="p-4 border rounded-xl space-y-2">
      <div className="font-semibold">48h Report — {data.id}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Private Calls: <b>{m.private_calls_total ?? "-"}</b></div>
        <div>Private Errors: <b>{m.private_errors_total ?? "-"}</b></div>
        <div>TWAP Slices: <b>{m.twap_slices_total ?? "-"}</b></div>
        <div>WS Disconnects: <b>{m.ws_disconnects_total ?? "-"}</b></div>
        <div>Risk Breaches: <b>{m.risk_breaches_total ?? "-"}</b></div>
        <div>Avg Unrealized: <b>{m.avg_unrealized?.toFixed?.(4) ?? "-"}</b></div>
      </div>
      <button className="mt-2 px-3 py-2 rounded-xl border" onClick={load}>Refresh</button>
    </div>
  );
} 