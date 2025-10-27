'use client';
import { postPublic } from "@/lib/client/postPublic";
import { bus } from "@/lib/bus";
import { useState } from "react";

export default function ControlCenter({ compact=false }:{ compact?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [risk, setRisk] = useState<string>('0.5');

  async function mode(mode: 'grid'|'trend'|'scalp'|'start'|'stop') {
    try {
      setBusy(mode);
      bus.emit('dash:optimistic:manager' as any, { mode });
      const r = await postPublic('/strategy/mode', { mode });
      bus.emit('dash:refresh:manager' as any); bus.emit('dash:refresh:portfolio' as any);
      if (!r.ok) throw new Error(String((r as any).status));
    } finally { setBusy(null); }
  }
  async function setRiskPct() {
    const percent = Number(risk);
    try {
      setBusy('risk');
      bus.emit('dash:optimistic:manager' as any, { risk_pct: percent });
      const r = await postPublic('/risk/set', { percent });
      bus.emit('dash:refresh:manager' as any);
      if (!r.ok) throw new Error(String((r as any).status));
    } finally { setBusy(null); }
  }

  const btn = "px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm disabled:opacity-50";
  return (
    <div className="space-y-3">
      {!compact && <h3 className="text-sm font-semibold">Control Center</h3>}
      <div className="flex flex-wrap gap-2">
        {(['grid','trend','scalp','start','stop'] as const).map(m => (
          <button key={m} disabled={!!busy} onClick={()=>mode(m)} className={btn}>{m}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={risk} onChange={e=>setRisk(e.target.value)}
          placeholder="risk % (örn 0.5)"
          className="flex-1 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-sm"
        />
        <button disabled={!!busy} onClick={setRiskPct} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-sm text-white">
          risk % ayarla
        </button>
      </div>
      {busy && <div className="text-xs text-zinc-400">işlem: {busy}…</div>}
    </div>
  );
} 