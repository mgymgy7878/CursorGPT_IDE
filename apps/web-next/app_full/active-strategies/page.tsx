"use client";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import LiveSparkline from '@/components/strategies/LiveSparkline';
import { useActiveStrategies } from '@/stores/activeStrategiesStore';

export default function ActiveStrategiesPage() {
  const { rows, refresh, start, pause, stop, upsert } = useActiveStrategies();

  useEffect(()=>{ refresh(); }, [refresh]);
  useEffect(()=>{
    const ws = new WebSocket(process.env.NEXT_PUBLIC_EXECUTOR_WS_URL ?? 'ws://127.0.0.1:4001/ws/strategies');
    ws.onmessage = (e)=>{
      try{
        const msg = JSON.parse(e.data);
        if (msg?.type==='snapshot' && Array.isArray(msg.rows)) msg.rows.forEach((r:any)=>upsert(r));
        if (msg?.type==='delta' && msg.row) upsert(msg.row);
      }catch{}
    };
    return ()=>ws.close();
  }, [upsert]);

  const demo = rows.length ? rows : [
    { id:'rsi-scalp', name:'RSI-Scalp v3', status:'stopped', pl:0 },
    { id:'breakout-15m', name:'Breakout-15m', status:'stopped', pl:0 },
  ];

  return (
    <div className="h-full overflow-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Çalışan Stratejiler</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {demo.map((r:any) => (
          <div key={r.id} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.id} · {r.status}</div>
              </div>
              <div className={r.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {r.pl >= 0 ? '+' : ''}{r.pl}
              </div>
            </div>
            <LiveSparkline id={r.id} />
            <div className="flex gap-2">
              <button onClick={()=>start(r.id,r.name)} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Çalıştır</button>
              <button onClick={()=>pause(r.id)} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Duraklat</button>
              <button onClick={()=>stop(r.id)}  className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Durdur</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
