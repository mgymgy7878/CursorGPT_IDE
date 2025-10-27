'use client';

import { useEffect, useState } from "react";

type Canary = { ok: boolean; source: 'executor'|'evidence'|'none'; data?: any; error?: string; };

export default function CanaryStatusCard() {
  const [s, setS] = useState<Canary | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/api/public/canary/status', { cache:'no-store' });
        const j = await r.json();
        if (alive) setS(j);
      } catch {
        if (alive) setS({ ok:false, source:'none', error:'ui_fetch_failed' });
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!s) return <div className="animate-pulse text-zinc-400">Yükleniyor…</div>;

  const isBuilder = process.env.NEXT_PUBLIC_UI_BUILDER === 'true';
  const ok = s.ok && (isBuilder || s.source === 'executor');

  return (
    <div className="space-y-3">
      <div className="chips">
        <span className={`chip ${ok ? 'ok' : 'warn'}`}>{ok ? 'HEALTHY' : 'DEGRADED'}</span>
        <span className="chip">{`src:${s.source ?? 'none'}`}</span>
      </div>

      {s.ok && s.data ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="subtle">Step</span><div className="font-semibold">{s.data.step ?? 'unknown'}</div></div>
          <div><span className="subtle">Fills</span><div className="font-semibold">{s.data.fills ?? 0}/{s.data.target ?? '?'}</div></div>
          <div><span className="subtle">P&amp;L</span><div className="font-semibold">${Number(s.data.pnl ?? 0).toFixed(2)}</div></div>
          <div><span className="subtle">Updated</span><div className="font-semibold">{s.data.ts ?? '—'}</div></div>
        </div>
      ) : (
        <div className="subtle text-sm">
          Canary verisi alınamadı. UI erişilebilir kalır. <span className="chip warn">{s.error ?? 'unknown'}</span>
        </div>
      )}
    </div>
  );
} 