'use client';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr:false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr:false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr:false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr:false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr:false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr:false });

const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export default function P95Card() {
  const { data, error } = useSWR('/api/executor/metrics/p95', fetcher, { refreshInterval: 5000 });
  const [points, setPoints] = useState<{t:number, p95:number|null}[]>([]);
  const maxPoints = 60;
  const once = useRef(false);

  useEffect(() => {
    if (!data?.ok) return;
    const p95 = data.stats?.p95 ?? null;
    setPoints(prev => {
      const next = [...prev, { t: data.ts, p95 }];
      return next.slice(Math.max(0, next.length - maxPoints));
    });
  }, [data?.ts]);

  const latest = points.length ? points[points.length-1].p95 : null;

  return (
    <section className="rounded-xl border border-white/10 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-medium">Place→ACK P95</h2>
        <div className="text-sm opacity-70">{latest != null ? `${(latest*1000).toFixed(0)} ms` : '—'}</div>
      </div>
      <div className="h-32 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points.map(p=>({ t:new Date(p.t).toLocaleTimeString(), p95_ms: p.p95 ? p.p95*1000 : null }))}>
            <XAxis dataKey="t" hide />
            <YAxis domain={[0, 'auto']} tickFormatter={(v)=>`${v|0}ms`} />
            <Tooltip formatter={(v:any)=>`${v|0} ms`} />
            <Line type="monotone" dataKey="p95_ms" strokeWidth={2} dot={false} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs opacity-60 mt-2">Kaynak: /metrics → spark_place_ack_duration_seconds</p>
      {error && <p className="text-xs text-red-400 mt-2">Hata: {String(error)}</p>}
    </section>
  );
}
