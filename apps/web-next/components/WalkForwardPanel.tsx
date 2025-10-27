import React, { useMemo, useRef, useState, useEffect } from "react";
import WFChart from "./WFChart";
import WFSummaryCards from "./WFSummaryCards";

export default function WalkForwardPanel() {
  const [base, setBase] = useState({
    symbol: 'BTCUSDT', timeframe: '1h',
    start: Date.now() - 60*24*60*60*1000,
    end: Date.now(), commission: 0.0004, leverage: 1
  });
  const [params, setParams] = useState<Record<string, number>>({ fast: 12, slow: 34 });
  const [windowPct, setWindowPct] = useState(0.5);
  const [stepPct, setStepPct] = useState(0.2);
  const [oosPct, setOosPct] = useState(0.2);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<{ idx:number; start:number; end:number; in:any; oos?:any }>>([]);
  const [summary, setSummary] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const esRef = useRef<EventSource | null>(null);

  async function onRun() {
    setRows([]); setSummary(null); setResult(null); setRunning(true);
    const rid = Math.random().toString(36).slice(2);
    setRunId(rid);
    const res = await fetch('/api/strategy/walkforward?runId='+rid, {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ base, params, windowPct, stepPct, oosPct })
    });
    const json = await res.json();
    if (!json?.success) {
      setRunning(false);
    } else {
      setResult(json.data);
    }
  }

  useEffect(() => {
    if (!running || !runId) return;
    const es = new EventSource('/api/logs/sse?runId='+runId);
    esRef.current = es;
    const onStart = (ev: MessageEvent) => { /* no-op */ };
    const onProg = (ev: MessageEvent) => {
      const p = JSON.parse(ev.data);
      setRows(rs => [...rs, { idx:p.idx, start:p.window.start, end:p.window.end, in:p.in, oos:p.oos }]);
    };
    const onFinish = (ev: MessageEvent) => {
      const p = JSON.parse(ev.data);
      setSummary(p.summary); setRunning(false);
      setResult({ runId, windows: rows, summary: p.summary });
    };
    es.addEventListener('wf-start', onStart);
    es.addEventListener('wf-progress', onProg);
    es.addEventListener('wf-finish', onFinish);
    es.onerror = () => { es.close(); setRunning(false); };
    return () => { es.removeEventListener('wf-start', onStart); es.removeEventListener('wf-progress', onProg); es.removeEventListener('wf-finish', onFinish); es.close(); esRef.current = null; };
  }, [running, runId, rows]);

  function exportWFcsv(r: any) {
    const ws: any[] = Array.isArray(r?.windows) ? r.windows : [];
    const to = (w:any,k:string)=> w?.oos?.[k] ?? w?.outSample?.[k] ?? '';
    const rowsCsv = ws.map((w,i)=>[
      i+1, w.window?.start ?? w.start ?? '', w.window?.end ?? w.end ?? '',
      to(w,'totalPnl'), to(w,'maxDrawdown'), to(w,'winRate'), (w.params ? JSON.stringify(w.params) : '')
    ].join(','));
    const headers = 'idx,start,end,oosPnL,oosDD,oosWR,params';
    const blob = new Blob([headers+'\n'+rowsCsv.join('\n')],{type:'text/csv'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='walkforward.csv'; a.click(); URL.revokeObjectURL(url);
  }
  async function exportWFpdf(r: any) {
    const res = await fetch('/api/report/wf-pdf', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ title: 'Walk-Forward Report', result: r })
    });
    if (!res.ok) { alert('PDF oluşturulamadı'); return; }
    const blob = await res.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'walkforward_report.pdf'; a.click(); URL.revokeObjectURL(url);
  }

  const total = rows.length;
  const avgSharpe = useMemo(() => {
    const vals = rows.map(w => w.oos?.sharpe ?? w.in?.sharpe).filter(v => v!=null) as number[];
    if (!vals.length) return null; return vals.reduce((a,b)=>a+b,0)/vals.length;
  }, [rows]);

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div className="panel" style={{ padding:12, display:'grid', gap:8 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <label>Sembol<br/><input className="input" value={base.symbol} onChange={e=>setBase(b=>({ ...b, symbol:e.target.value }))}/></label>
          <label>TF<br/><input className="input" value={base.timeframe} onChange={e=>setBase(b=>({ ...b, timeframe:e.target.value }))}/></label>
          <label>Window %<br/><input className="input" type="number" min={0.05} max={0.95} step={0.05} value={windowPct} onChange={e=>setWindowPct(Number(e.target.value))}/></label>
          <label>Step %<br/><input className="input" type="number" min={0.01} max={0.95} step={0.01} value={stepPct} onChange={e=>setStepPct(Number(e.target.value))}/></label>
          <label>OOS %<br/><input className="input" type="number" min={0} max={0.9} step={0.05} value={oosPct} onChange={e=>setOosPct(Number(e.target.value))}/></label>
          <button className="btn primary" onClick={onRun} disabled={running}>{running ? 'Çalışıyor…' : 'WF Başlat'}</button>
          {result?.windows?.length ? (
            <>
              <button className="btn" onClick={()=>exportWFcsv(result)}>CSV indir</button>
              <button className="btn primary" onClick={()=>exportWFpdf(result)}>PDF indir</button>
            </>
          ) : null}
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <span className={`chip ${running ? 'chip--running' : 'chip--idle'}`}>{running ? 'RUNNING' : 'IDLE'}</span>
          <span className="chip chip--info">windows: {total}</span>
          <span className="chip">avgSharpe: {avgSharpe ?? '—'}</span>
        </div>
      </div>

      {result ? (
        <>
          <WFSummaryCards result={result} />
          <WFChart result={result} />
        </>
      ) : <div className="panel" style={{ padding:12, opacity:.6 }}>WF sonucu yok.</div>}

      <div className="panel" style={{ padding:12 }}>
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(100px, 1fr))', gap:6, fontSize:12, fontWeight:600, color:'#374151' }}>
            <div>#</div><div>IS Return</div><div>IS WR</div><div>OOS Return</div><div>OOS WR</div><div>Sharpe(OOS|IS)</div>
          </div>
          {rows.map(w => (
            <div key={w.idx} style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(100px, 1fr))', gap:6, fontSize:12 }}>
              <div>{w.idx}</div>
              <div>{w.in?.totalPnl?.toFixed?.(2) ?? w.in?.totalPnl ?? '—'}</div>
              <div>{((w.in?.winRate ?? 0)*100).toFixed?.(1) ?? w.in?.winRate ?? '—'}%</div>
              <div>{w.oos?.totalPnl?.toFixed?.(2) ?? w.oos?.totalPnl ?? '—'}</div>
              <div>{((w.oos?.winRate ?? 0)*100).toFixed?.(1) ?? w.oos?.winRate ?? '—'}%</div>
              <div>{(w.oos?.sharpe ?? w.in?.sharpe) ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
