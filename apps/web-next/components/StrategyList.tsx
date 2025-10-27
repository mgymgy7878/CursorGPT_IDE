'use client';
import { useEffect, useState } from "react";

type Item = { id:string; name:string; versions:number; updatedAt:number };

export default function StrategyList({ refreshKey, onLoad }: { refreshKey?: number; onLoad?: (code:string)=>void }) {
  const [items, setItems] = useState<Item[]|null>(null);
  const [err, setErr] = useState<string>('');

  const load = async () => {
    try {
      setErr(''); setItems(null);
      const r = await fetch('/api/public/lab/strategies', { cache:'no-store' });
      const j = await r.json();
      setItems(j?.items ?? []);
    } catch (e) { setErr(String(e)); }
  };
  useEffect(()=>{ load(); }, [refreshKey]);

  const loadCode = async (id:string) => {
    try {
      const r = await fetch(`/api/public/lab/strategies?id=${encodeURIComponent(id)}`, { cache:'no-store' });
      const j = await r.json();
      const code = j?.item?.latest?.code || j?.item?.versions?.at(-1)?.code || '';
      if (code) onLoad?.(code);
    } catch {}
  };

  return (
    <div className="space-y-2">
      <div className="text-lg font-semibold">Kaydedilen Stratejiler</div>
      {!items && !err && <div className="text-sm opacity-60">yükleniyor…</div>}
      {err && <div className="text-sm text-red-400">degraded: {err}</div>}
      <div className="space-y-1 max-h-64 overflow-auto">
        {(items ?? []).map(it=>(
          <div key={it.id} className="flex items-center justify-between bg-neutral-900/60 border rounded px-2 py-1">
            <div className="text-sm">
              <div className="font-medium">{it.name}</div>
              <div className="text-xs opacity-60">v{it.versions} • {new Date(it.updatedAt).toLocaleString()}</div>
            </div>
            <button onClick={()=>loadCode(it.id)} className="px-2 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500">Yükle</button>
          </div>
        ))}
        {(items?.length ?? 0) === 0 && <div className="text-sm opacity-60">henüz kayıt yok</div>}
      </div>
      <button onClick={load} className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600">yenile</button>
    </div>
  );
} 