// apps/web-next/components/shell/CommandPalette.tsx
'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const items = [
  { k: 'Go: Dashboard', run: (r: any) => r.push('/dashboard') },
  { k: 'Go: Orders', run: (r: any) => r.push('/orders') },
  { k: 'Go: Positions', run: (r: any) => r.push('/positions') },
  { k: 'Go: Strategy Lab', run: (r: any) => r.push('/strategy-lab') },
  { k: 'Go: Backtest', run: (r: any) => r.push('/backtest') },
  { k: 'Go: Canary', run: (r: any) => r.push('/canary') },
  { k: 'Open AI (full page)', run: (r: any) => r.push('/ai') },
  { k: 'AI: "Suggest strategy params"', run: () => dispatchAI('/strategy-lab', 'Suggest strategy params for current market.') },
  { k: 'AI: "Create price alert @threshold"', run: () => dispatchAI('/dashboard', 'Create price alert at 72000 above, repeats=1, tags=binance') },
  { k: 'AI: "Run quick backtest (SMA 10/30)"', run: () => dispatchAI('/backtest', 'Run quick backtest: SMA(10/30) on latest CSV.') },
];

function dispatchAI(path: string, prompt: string) {
  try { localStorage.setItem('ai:quick', JSON.stringify({ path, prompt, ts: Date.now() })); } catch {}
  window.location.href = '/ai';
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = items.filter(i => i.k.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const metaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (metaK) { e.preventDefault(); setOpen(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return (
    <button title="Komut paleti (Cmd/Ctrl+K)" onClick={()=>setOpen(true)}
      className="px-2 py-1 rounded border border-zinc-700 text-sm hover:bg-zinc-900">⌘K</button>
  );
  return (
    <div className="fixed inset-0 z-[70]" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={()=>setOpen(false)} />
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[680px] max-w-[96vw] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl">
        <div className="p-2 border-b border-zinc-800">
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Type a command…"
            className="w-full bg-transparent outline-none px-2 py-1 text-sm" />
        </div>
        <ul className="max-h-80 overflow-auto">
          {list.map((i, idx) => (
            <li key={idx}>
              <button onClick={()=>{ setOpen(false); i.run(router); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-800">
                {i.k}
              </button>
            </li>
          ))}
          {!list.length && <li className="px-3 py-3 text-sm text-zinc-500">No results</li>}
        </ul>
      </div>
    </div>
  );
} 