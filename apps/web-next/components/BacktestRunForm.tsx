import { useState } from "react";
import { useBacktestStore } from "../stores/useBacktestStore";

export function BacktestRunForm() {
  const { params, setParams, run, loading } = useBacktestStore();
  const [local, setLocal] = useState(params);

  function onChange<K extends keyof typeof local>(key: K, val: (typeof local)[K]) {
    setLocal(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div style={{ display:'flex', gap:12, alignItems:'end', flexWrap:'wrap' }}>
      <label> Sembol<br/>
        <input value={local.symbol} onChange={e=>onChange('symbol', e.target.value)} className="input" />
      </label>
      <label> Periyot<br/>
        <input value={local.timeframe} onChange={e=>onChange('timeframe', e.target.value)} className="input" />
      </label>
      <label> Bar Sayısı<br/>
        <input type="number" value={local.barCount ?? 1000} onChange={e=>onChange('barCount', Number(e.target.value))} className="input" />
      </label>
      <label> Komisyon<br/>
        <input type="number" step="0.0001" value={local.commission ?? 0} onChange={e=>onChange('commission', Number(e.target.value))} className="input" />
      </label>
      <button
        className="btn primary"
        disabled={loading}
        onClick={() => { setParams(local); run(); }}
        title="Backtest'i çalıştır"
      >
        {loading ? 'Çalışıyor…' : 'Backtest Çalıştır'}
      </button>
    </div>
  );
} 
