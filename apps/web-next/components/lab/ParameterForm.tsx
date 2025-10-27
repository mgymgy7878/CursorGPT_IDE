'use client';
import { useState } from "react";

type Params = {
  symbol: string;
  timeframe: '5m' | '15m' | '1h' | '4h' | '1d';
  maFast: number;
  maSlow: number;
  start?: string;
  end?: string;
};

export default function ParameterForm({
  onRunBacktest,
  onRunOptimize,
}: {
  onRunBacktest?: (p: Params) => void;
  onRunOptimize?: (p: Params) => void;
}) {
  const [p, setP] = useState<Params>({
    symbol: 'BTCUSDT',
    timeframe: '15m',
    maFast: 20,
    maSlow: 100,
  });
  const set = <K extends keyof Params,>(k: K, v: Params[K]) =>
    setP((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunBacktest?.(p);
  };

  return (
    <form onSubmit={submit} className="card">
      <div className="card-head">
        <h2 className="text-lg font-semibold">Strateji Parametreleri</h2>
      </div>

      <div className="card-body grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span>İşlem Çifti</span>
          <input className="input" value={p.symbol}
            onChange={(e) => set('symbol', e.target.value)} />
        </label>

        <label className="flex flex-col gap-1">
          <span>Zaman Dilimi</span>
          <select className="input" value={p.timeframe}
            onChange={(e) => set('timeframe', e.target.value as Params['timeframe'])}>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span>MA Hızlı</span>
          <input type="number" className="input" value={p.maFast}
            onChange={(e) => set('maFast', Number(e.target.value))} />
        </label>

        <label className="flex flex-col gap-1">
          <span>MA Yavaş</span>
          <input type="number" className="input" value={p.maSlow}
            onChange={(e) => set('maSlow', Number(e.target.value))} />
        </label>

        <label className="flex flex-col gap-1">
          <span>Başlangıç (opsiyonel)</span>
          <input className="input" placeholder="2024-06-01"
            value={p.start ?? ''} onChange={(e) => set('start', e.target.value || undefined)} />
        </label>

        <label className="flex flex-col gap-1">
          <span>Bitiş (opsiyonel)</span>
          <input className="input" placeholder="2024-08-01"
            value={p.end ?? ''} onChange={(e) => set('end', e.target.value || undefined)} />
        </label>
      </div>

      <div className="card-foot flex gap-2">
        <button type="submit" className="btn">Backtest</button>
        <button type="button" className="btn" onClick={() => onRunOptimize?.(p)}>Optimize</button>
      </div>
    </form>
  );
} 