'use client';
import { useState } from "react";
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

export default function ChatDockPanel() {
  const [q, setQ] = useState('');
  const [log, setLog] = useState<string[]>([]);
  async function handleRun() {
    const t = q.trim(); if (!t) return;
    for (const it of intents) {
      const m = t.match(it.re);
      if (m) {
        setLog(x => [`» ${t}`, ...x]);
        const res = await it.run(m as any);
        setLog(x => [`✓ ${res}`, ...x]); setQ(''); return;
      }
    }
    setLog(x => [`? anlaşılamadı: ${t}`, ...x]);
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">ChatDock</h3>
        <span className="text-[10px] text-zinc-500">komutlar: grid | trend | scalp | start | stop | risk %X | özet</span>
      </div>
      <div className="flex gap-2">
        <input
          value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleRun()}
          placeholder="ör. grid'e al  •  risk %0.7  •  özet"
          className="flex-1 px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-sm"
        />
        <button onClick={handleRun} className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500 text-sm text-white">çalıştır</button>
      </div>
      <div className="h-28 overflow-auto text-xs space-y-1 bg-zinc-900/40 rounded border border-zinc-800 p-2">
        {log.length===0 ? <div className="text-zinc-500">henüz kayıt yok</div> : log.map((l,i)=><div key={i} className="text-zinc-200">{l}</div>)}
      </div>
    </div>
  );
} 