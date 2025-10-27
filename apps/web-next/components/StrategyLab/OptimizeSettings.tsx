import React from "react";
import { useStrategyLabStore } from "../../stores/useStrategyLabStore";

export default function OptimizeSettings() {
  const {
    optSettings, setOptSettings, regenRangesFromParams, setOptRanges, params, optRunning
  } = useStrategyLabStore();

  const ranges = optSettings.ranges ?? Object.entries(params).map(([k, v]) => ({
    key: k, min: Number((Number(v || 1) * 0.5).toFixed(6)), max: Number((Number(v || 1) * 1.5).toFixed(6)), step: 1
  }));

  const onChangeRange = (i: number, field: 'key'|'min'|'max'|'step', value: string) => {
    const next = ranges.map((r, idx) => idx === i ? { ...r, [field]: field==='key' ? value : Number(value) } : r);
    setOptRanges(next as any);
  };

  return (
    <div className="panel" style={{ padding: 12, display:'grid', gap: 10 }}>
      <h3 style={{ margin: 0 }}>Optimize Ayarları</h3>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
        <label>Yöntem<br/>
          <select className="input" value={optSettings.method}
            onChange={e=>setOptSettings({ method: e.target.value as any })} disabled={optRunning}>
            <option value="grid">Grid</option>
            <option value="random">Random</option>
          </select>
        </label>
        <label>Max Samples<br/>
          <input className="input" type="number" min={1} value={optSettings.maxSamples}
            onChange={e=>setOptSettings({ maxSamples: Number(e.target.value) })} disabled={optRunning}/>
        </label>
        <label>OOS %<br/>
          <input className="input" type="number" step={0.05} min={0} max={0.9} value={optSettings.oosPercent}
            onChange={e=>setOptSettings({ oosPercent: Number(e.target.value) })} disabled={optRunning}/>
        </label>
        <label>Hedef Metrik<br/>
          <select className="input" value={optSettings.target}
            onChange={e=>setOptSettings({ target: e.target.value as any })} disabled={optRunning}>
            <option value="totalPnl">totalPnl</option>
            <option value="sharpe">sharpe</option>
            <option value="winRate">winRate</option>
            <option value="maxDrawdown">maxDrawdown</option>
          </select>
        </label>
        <label>Yön<br/>
          <select className="input" value={optSettings.direction}
            onChange={e=>setOptSettings({ direction: e.target.value as any })} disabled={optRunning}>
            <option value="desc">desc (büyüğü iyi)</option>
            <option value="asc">asc (küçüğü iyi)</option>
          </select>
        </label>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:12, opacity:.7 }}>Parametre Aralıkları</div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={regenRangesFromParams} disabled={optRunning}>Parametrelerden üret</button>
        </div>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead><tr><th>Param</th><th>Min</th><th>Max</th><th>Step</th></tr></thead>
          <tbody>
            {ranges.map((r: any, i: number) => (
              <tr key={i}>
                <td><input className="input" value={r.key} onChange={e=>onChangeRange(i, 'key', e.target.value)} disabled={optRunning}/></td>
                <td><input className="input" type="number" value={r.min} onChange={e=>onChangeRange(i, 'min', e.target.value)} disabled={optRunning}/></td>
                <td><input className="input" type="number" value={r.max} onChange={e=>onChangeRange(i, 'max', e.target.value)} disabled={optRunning}/></td>
                <td><input className="input" type="number" step={0.01} value={r.step ?? 1} onChange={e=>onChangeRange(i, 'step', e.target.value)} disabled={optRunning}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        .input { border:1px solid rgba(0,0,0,.12); border-radius:8px; padding:6px 8px; width:100% }
        .tableWrap { overflow:auto; }
        .table { width:100%; border-collapse:collapse; font-size:13px }
        .table th, .table td { padding:6px 8px; border-bottom:1px solid #e5e7eb; text-align:left }
        .table th { font-weight:600; color:#374151; background:#f9fafb; position:sticky; top:0; }
        .btn { padding:6px 10px; border-radius:8px; border:1px solid rgba(0,0,0,.08); background:#fff; cursor:pointer }
      `}</style>
    </div>
  );
} 
