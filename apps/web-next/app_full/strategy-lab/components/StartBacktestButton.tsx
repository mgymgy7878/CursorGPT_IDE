'use client';
import { useState } from "react";
import LabProgress from "./LabProgress";

export default function StartBacktestButton({ code }: { code: string }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    setErr(null);
    try {
      const r = await fetch('/api/public/lab/backtest', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ code, lang:'ts', symbol:'BTCUSDT', tf:'1m', from:null, to:null, params:{} })
      });
      const js = await r.json();
      if (!r.ok || js.ok === false) { setErr('degraded_or_error'); return; }
      setJobId(js.jobId);
    } catch {
      setErr('network_error');
    }
  };

  return (
    <div className="space-y-2">
      <button onClick={start} className="px-3 py-1.5 rounded bg-zinc-900 text-white text-sm">Backtest Başlat</button>
      {err && <div className="text-xs text-amber-700">Hata/Degrade: {err}</div>}
      {jobId && <LabProgress jobId={jobId} />}
    </div>
  );
} 