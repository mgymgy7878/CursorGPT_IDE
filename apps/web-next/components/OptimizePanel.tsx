import React, { useEffect, useRef, useState } from "react";
import { useOptimizeStore as useOptStore } from "../stores/useOptimizeStore";
// import type { OptimizeRequest } from "@spark/shared";
type OptimizeRequest = any;

type BestSample = { params: Record<string, number>; score: number } | null;

export default function OptimizePanel() {
  const { start, result, running } = useOptStore();
  const [form, setForm] = useState<OptimizeRequest>({
    base: {
      symbol: 'BTCUSDT', timeframe: '1h',
      start: Date.now() - 30*24*60*60*1000,
      end: Date.now(), commission: 0.0004, leverage: 1
    },
    ranges: [
      { key: 'fast', min: 5, max: 20, step: 1 },
      { key: 'slow', min: 21, max: 60, step: 3 }
    ],
    method: 'grid', maxSamples: 500, oosPercent: 0.2, target: 'totalPnl', direction: 'desc'
  });

  const esRef = useRef<EventSource | null>(null);
  const [lines, setLines] = useState<Array<{ t: string; msg: string }>>([]);
  const [progress, setProgress] = useState<{done:number;total:number;pct:number}|null>(null);
  const [best, setBest] = useState<BestSample>(null);

  function onRun() {
    setLines([]); setProgress(null); setBest(null);
    start(form as any);
  }

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      const st = useOptStore.getState();
      if (!st.runId) return;
      const es = new EventSource(`/api/logs/sse?runId=${st.runId}`);
      esRef.current = es;

      const push = (t: string, msg: string) => setLines(l => [...l, { t, msg }].slice(-300));

      const onStart = (ev: MessageEvent) => {
        const p = JSON.parse(ev.data);
        setProgress({ done:0, total:p.total, pct:0 });
        push('optimize-start', `total=${p.total}`);
      };
      const onProg = (ev: MessageEvent) => {
        const p = JSON.parse(ev.data);
        setProgress({ done:p.done, total:p.total, pct:p.pct });
        push('optimize-progress', `#${p.done}/${p.total} ${p.pct}% params=${JSON.stringify(p.params)} score=${p.score.toFixed?.(4) ?? p.score}`);
      };
      const onBest = (ev: MessageEvent) => {
        const p = JSON.parse(ev.data);
        const b = { params: p.best.params, score: p.best.score };
        setBest(b);
        push('optimize-best', JSON.stringify(b));
      };
      const onFinish = (ev: MessageEvent) => {
        const p = JSON.parse(ev.data);
        push('optimize-finish', `best=${JSON.stringify(p.best)}`);
      };

      es.addEventListener('optimize-start', onStart);
      es.addEventListener('optimize-progress', onProg);
      es.addEventListener('optimize-best', onBest);
      es.addEventListener('optimize-finish', onFinish);
      es.onerror = () => { es.close(); };

      return () => {
        es.removeEventListener('optimize-start', onStart);
        es.removeEventListener('optimize-progress', onProg);
        es.removeEventListener('optimize-best', onBest);
        es.removeEventListener('optimize-finish', onFinish);
        es.close();
      };
    }, 50);
    return () => { clearTimeout(t); const es = esRef.current; if (es) es.close(); esRef.current = null; };
  }, [running]);

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div className="panel" style={{ padding:12, display:'grid', gap:8 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'end' }}>
          <label>Yöntem<br/><select className="input" value={form.method} onChange={e=>setForm(f=>({ ...f, method: e.target.value as any }))}>
            <option value="grid">Grid</option>
            <option value="random">Random</option>
          </select></label>
          <label>OOS %<br/><input className="input" type="number" min={0} max={0.9} step={0.05} value={form.oosPercent}
            onChange={e=>setForm(f=>({ ...f, oosPercent: Number(e.target.value) }))}/></label>
          <label>Max Samples<br/><input className="input" type="number" value={form.maxSamples}
            onChange={e=>setForm(f=>({ ...f, maxSamples: Number(e.target.value) }))}/></label>
          <label>Target<br/><select className="input" value={form.target} onChange={e=>setForm(f=>({ ...f, target: e.target.value as any }))}>
            <option value="totalPnl">totalPnl (desc)</option>
            <option value="sharpe">sharpe (desc)</option>
            <option value="winRate">winRate (desc)</option>
            <option value="maxDrawdown">maxDrawdown (asc)</option>
          </select></label>
          <button className="btn primary" onClick={onRun} disabled={running}>{running ? 'Çalışıyor…' : 'Optimize Et'}</button>
        </div>
        {progress && <div style={{ fontFamily:'ui-monospace, monospace', fontSize:12 }}>
          İlerleme: {progress.done}/{progress.total} ({progress.pct}%)
        </div>}
      </div>

      <div className="panel" style={{ padding:12 }}>
        <div style={{ opacity:.7, marginBottom:8 }}>Günlük</div>
        <div style={{ maxHeight:220, overflow:'auto', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:12 }}>
          {lines.map((l,i)=><div key={i}><span style={{ color: l.t==='optimize-best' ? '#065f46' : l.t.includes('progress') ? '#1e40af' : '#374151', fontWeight:600 }}>{l.t}</span> <span style={{ opacity:.9 }}>{l.msg}</span></div>)}
        </div>
      </div>

      {result?.samples?.length ? <OptimizeHeatmap samples={result.samples as any} best={best ?? undefined} /> : null}
    </div>
  );
}

function OptimizeHeatmap({ samples, best }: {
  samples: Array<{ params: Record<string, number>; score: number }>;
  best?: { params: Record<string, number>; score: number };
}) {
  const keys = React.useMemo(() => Array.from(new Set(samples.flatMap(s => Object.keys(s.params)))), [samples]);
  const has2 = keys.length >= 2;
  const kX = has2 ? keys[0] : '';
  const kY = has2 ? keys[1] : '';
  const xs = React.useMemo(() => has2 ? Array.from(new Set(samples.map(s => s.params[kX]))).sort((a,b)=>a-b) : [], [samples, has2, kX]);
  const ys = React.useMemo(() => has2 ? Array.from(new Set(samples.map(s => s.params[kY]))).sort((a,b)=>a-b) : [], [samples, has2, kY]);
  const matrix = React.useMemo(() => has2 ? ys.map(y => xs.map(x => {
    const hit = samples.find(s => s.params[kX]===x && s.params[kY]===y);
    return hit?.score ?? Number.POSITIVE_INFINITY;
  })) : [], [ys, xs, samples, has2, kX, kY]);
  const flat = React.useMemo(()=>matrix.flat().filter(v=>isFinite(v)) as number[], [matrix]);
  const min = React.useMemo(()=>flat.length ? Math.min(...flat) : 0, [flat]);
  const max = React.useMemo(()=>flat.length ? Math.max(...flat) : 1, [flat]);
  const [hover, setHover] = React.useState<{x:number;y:number;v:number}|null>(null);

  const color = (v:number) => {
    if (!isFinite(v)) return '#e5e7eb';
    const t = (v - min) / Math.max(1e-9, (max - min));
    const r = Math.round(255 * t), g = Math.round(200 * (1 - t));
    return `rgb(${r},${g},120)`;
  };
  const isBest = (x:number,y:number) => best && best.params[kX] === x && best.params[kY] === y;

  if (!has2) return <div className="panel" style={{ padding:12 }}>Heatmap için en az 2 parametre gerek.</div>;

  return (
    <div className="panel" style={{ padding:12 }}>
      <div style={{ marginBottom:8, opacity:.7 }}>OptimizeHeatmap ({kX} × {kY})</div>
      <div style={{ display:'grid', gridTemplateColumns: `auto repeat(${xs.length}, 18px)`, gap:4, alignItems:'center' }}>
        <div />
        {xs.map(x => <div key={'hx'+x} style={{ fontSize:11, textAlign:'center' }}>{x}</div>)}
        {ys.map((y, yi) => (
          <React.Fragment key={'row'+y}>
            <div style={{ fontSize:11 }}>{y}</div>
            {xs.map((x, xi) => {
              const val = matrix[yi][xi];
              return (
                <div
                  key={'cell'+xi+'-'+yi}
                  onMouseEnter={()=>setHover({x,y,v:val})}
                  onMouseLeave={()=>setHover(null)}
                  title={`${kX}=${x}, ${kY}=${y} · ${isFinite(val) ? val : '—'}`}
                  style={{ width:18, height:18, background: color(val), outline: isBest(x,y) ? '2px solid #111' : '1px solid rgba(0,0,0,0.15)', borderRadius:3 }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {hover && <div className="chip" style={{ marginTop:8 }}> {kX}={hover.x}, {kY}={hover.y} · score <strong>{hover.v.toFixed?.(4) ?? hover.v}</strong></div>}
    </div>
  );
} 
