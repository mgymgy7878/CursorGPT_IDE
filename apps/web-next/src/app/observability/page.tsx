'use client';

import React, { useEffect, useState } from 'react';
import { fetchMetrics, parseSummary } from '@/lib/metrics';

export default function ObservabilityWrapper(){
  const [sum,setSum]=useState<any>(null);
  const [err,setErr]=useState<string|undefined>();
  async function load(){
    setErr(undefined);
    const txt = await fetchMetrics();
    if(txt==="# NA") setErr('NA');
    setSum(parseSummary(txt));
  }
  useEffect(()=>{ load(); },[]);
  const Cell = (k:string, v:number)=>(
    <div className="p-2 bg-gray-50 rounded border">
      <div className="text-[10px] text-gray-500">{k}</div>
      <div className="font-semibold">{Number.isFinite(v)? v.toFixed(3) : 'NA'}</div>
    </div>
  );
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-semibold">Observability</h1>
      <button className="px-3 py-1 border rounded" onClick={load}>Güncelle</button>
      {err && <div className="text-xs text-yellow-600">Metrics NA / Timeout</div>}
      {sum && <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Cell('p95', sum.p95)}
        {Cell('error_rate', sum.error_rate)}
        {Cell('ws_reconnect_total', sum.ws_reconnect_total)}
        {Cell('cache_hit_rate', sum.cache_hit_rate)}
      </div>}
    </div>
  );
}
