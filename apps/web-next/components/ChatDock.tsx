'use client';
import { useEffect, useState } from "react";
import { postPublic } from "@/lib/client/postPublic";
import { bus } from "@/lib/bus";

const intents = [
  { re: /\b(grid|trend|scalp|start|stop)\b/i, run: async (_m: RegExpMatchArray) => {
      const mode = _m[1].toLowerCase();
      bus.emit('dash:optimistic:manager' as any, { mode });
      const r = await postPublic('/strategy/mode', { mode });
      bus.emit('dash:refresh:manager' as any); bus.emit('dash:refresh:portfolio' as any);
      return r.ok ? `mode=${mode}` : `ERR ${r.status}`;
  }},
  { re: /risk\s*%?\s*([0-9]*\.?[0-9]+)/i, run: async (_m) => {
      const percent = Number(_m[1]);
      bus.emit('dash:optimistic:manager' as any, { risk_pct: percent });
      const r = await postPublic('/risk/set', { percent });
      bus.emit('dash:refresh:manager' as any);
      return r.ok ? `risk ${percent}%` : `ERR ${r.status}`;
  }},
  { re: /(özet|rapor)/i, run: async () => {
      bus.emit('dash:refresh:manager' as any); bus.emit('dash:refresh:portfolio' as any);
      return 'özet yenilendi';
  }},
];

export default function ChatDock() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(v=>!v); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  async function handleRun() {
    const t = q.trim(); if (!t) return;
    for (const it of intents) {
      const m = t.match(it.re);
      if (m) {
        setLog(x => [`» ${t}`, ...x]);
        const res = await it.run(m);
        setLog(x => [`✓ ${res}`, ...x]); setQ(''); return;
      }
    }
    setLog(x => [`? anlaşılamadı: ${t}`, ...x]);
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">ChatDock</h3>
          <button onClick={()=>setOpen(false)} className="text-xs text-zinc-400">esc</button>
        </div>
        <input
          autoFocus value={q} onChange={e=>setQ(e.target.value)}
          placeholder="ör. grid'e al  •  risk %0.7  •  özet"
          onKeyDown={e=>e.key==='Enter'&&handleRun()}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700"
        />
        <div className="text-xs text-zinc-400">Komutlar: grid | trend | scalp | start | stop | risk %X | özet</div>
        <div className="h-28 overflow-auto text-xs space-y-1">
          {log.map((l,i)=><div key={i} className="text-zinc-300">{l}</div>)}
        </div>
      </div>
    </div>
  );
} 