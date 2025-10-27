'use client';
import { useState } from "react";

export default function StrategyAIDock({ onInsert, onSaved }: { onInsert?: (code: string)=>void; onSaved?: ()=>void }) {
  const [q, setQ] = useState('btcusdt future kaldıraçlı çift yön strateji');
  const [out, setOut] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('yeni-strateji');

  const ask = async () => {
    setBusy(true); setOut('');
    try {
      const r = await fetch('/api/ai/strategy', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ input: q }) });
      const j = await r.json();
      setOut(j?.answer ?? JSON.stringify(j));
    } catch (e) { setOut(String(e)); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!out?.trim()) return;
    const payload = { name: name.trim() || 'untitled', code: out, meta: { from:'StrategyAI', prompt:q } };
    try {
      const r = await fetch('/api/public/lab/save', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j?.ok) { onSaved?.(); }
    } catch {}
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold">Strategy AI</div>
        <span className="text-xs opacity-60">mock/LLM</span>
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} className="w-full bg-neutral-900 border rounded px-2 py-1" placeholder="strateji isteği" />
        <button onClick={ask} disabled={busy} className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50">{busy?'üretiliyor…':'üret'}</button>
      </div>

      <pre className="text-sm bg-neutral-900/70 border rounded p-2 h-48 overflow-auto">{out||'—'}</pre>
      <div className="flex gap-2">
        <button onClick={()=>onInsert?.(out)} disabled={!out} className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40">Kodu Textarea'ya Ekle</button>
        <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-neutral-900 border rounded px-2" placeholder="strateji adı" />
        <button onClick={save} disabled={!out} className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40">Kaydet & Versiyonla</button>
      </div>
    </div>
  );
} 