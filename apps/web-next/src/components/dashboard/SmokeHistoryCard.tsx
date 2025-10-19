"use client";
import { useEffect, useState } from "react";

type Item = { ts:number|null; p95Ms:number|null; stalenessS:number|null; exitCode:number|null; path:string; artifactName?:string; hasZip?: boolean };

export default function SmokeHistoryCard(){
  const [items,setItems] = useState<Item[]>([]);
  const [cursor,setCursor] = useState<string>("");
  const [nextCursor,setNextCursor] = useState<string|null>(null);
  const [loading,setLoading] = useState<boolean>(false);
  const [debounceId,setDebounceId] = useState<any>(null);
  const [ac,setAc] = useState<AbortController|undefined>(undefined);

  function scheduleLoad(cur:string){
    if(debounceId) clearTimeout(debounceId);
    const id = setTimeout(()=>{ void load(cur); }, 250);
    setDebounceId(id);
  }

  async function load(cur:string){
    try{
      setLoading(true);
      if(ac){ try{ ac.abort(); }catch{} }
      const nac = new AbortController(); setAc(nac);
      const r = await fetch(`/api/public/smoke/history?cursor=${encodeURIComponent(cur)}&limit=20`, { cache: 'no-store' as any, signal: nac.signal });
      if(r.status === 304){ setLoading(false); return; }
      const j = await r.json().catch(()=>null);
      if(j?.items){
        setItems(cur? [...items, ...j.items as Item[]] : (j.items as Item[]));
        setNextCursor(j.nextCursor ?? null);
        setCursor(cur);
      }
    }catch{} finally{ setLoading(false); }
  }
  useEffect(()=>{ scheduleLoad(""); },[]);

  return (
    <div className="p-4 rounded-xl border border-neutral-800 bg-black/30">
      <div className="text-sm opacity-70 mb-2">Smoke Geçmişi</div>
      <div className="overflow-x-auto">
        {/* Mini sparklines: p95 & staleness */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <MiniSpark title="p95 (ms)" data={items.slice().reverse().map(it=>Number(it.p95Ms??0))} />
          <MiniSpark title="staleness (s)" data={items.slice().reverse().map(it=>Number(it.stalenessS??0))} />
        </div>
        <table className="tbl text-sm">
          <thead><tr><th>Zaman</th><th>P95 (ms)</th><th>Staleness (s)</th><th>Exit</th><th>Kanıt</th><th>ZIP</th></tr></thead>
          <tbody>
            {items.map((it, i)=>{
              const when = it.ts? new Date(it.ts).toLocaleString(): '—';
              const ok = (it.exitCode??0) === 0;
              const zipHref = it.path? `/util/smoke/zip?dir=${encodeURIComponent(it.path.split('/').pop()||'')}` : '';
              return (
                <tr key={i}>
                  <td>{when}</td>
                  <td className="font-mono">{it.p95Ms ?? '—'}</td>
                  <td className="font-mono">{it.stalenessS ?? '—'}</td>
                  <td className={ok? 'text-green-400':'text-red-400'}>{it.exitCode ?? '—'}</td>
                  <td>{it.path? <a className="underline" href={`/${it.path}`} target="_blank" rel="noreferrer noopener">Aç</a> : '—'}</td>
                  <td>{it.path? (
                    it.hasZip ? <a className="btn btn-xs" href={zipHref}>ZIP indir</a> : <ZipCreateButton dir={(it.path.split('/').pop()||'')} onCreated={()=>{
                      // optimistic update of hasZip
                      setItems(prev=> prev.map(x=> x.path===it.path? ({...x, hasZip:true}): x));
                    }} />
                  ) : '—'}</td>
                </tr>
              );
            })}
            {items.length===0 && <tr><td colSpan={6} className="muted">Kayıt yok.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs">
        <div>{loading? 'Yükleniyor...' : null}</div>
        <div className="flex items-center gap-2">
          <button className="btn btn-xs" disabled={!nextCursor || loading} onClick={()=> scheduleLoad(nextCursor || "")}>Daha Fazla</button>
        </div>
      </div>
    </div>
  );
}

function MiniSpark({ title, data }:{ title:string; data:number[] }){
  const w = 160, h = 32, pad = 2;
  const n = Math.max(1, data.length);
  const min = Math.min(0, ...data), max = Math.max(1, ...data);
  const rng = (max - min) || 1;
  const step = (w - pad*2) / Math.max(1, n - 1);
  const d = data.map((v,i)=>{
    const x = pad + i*step;
    const y = pad + (1 - (v - min)/rng) * (h - pad*2);
    return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  // Target reference line (middle of chart for simplified view)
  const midY = pad + (1 - 0.5) * (h - pad*2);
  return (
    <div className="text-xs">
      <div className="opacity-70 mb-1">{title}</div>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-label={title}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1} />
        <line x1={0} x2={w} y1={midY} y2={midY} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

function ZipCreateButton({ dir, onCreated }:{ dir:string; onCreated?:()=>void }){
  const [busy,setBusy] = useState(false);
  const [tried,setTried] = useState(false);
  async function run(){
    if(busy) return;
    setBusy(true);
    const url = `/util/smoke/zip?dir=${encodeURIComponent(dir)}&create=1`;
    try{
      const r = await fetch(url);
      if(r.ok){
        const created = r.headers.get('x-spark-zip-created') === '1';
        if(created && onCreated){ try{ onCreated(); }catch{} }
        // Trigger download via a hidden link
        const a = document.createElement('a');
        a.href = url; a.download = `${dir}.zip`; a.rel = 'noreferrer noopener';
        document.body.appendChild(a); a.click(); a.remove();
      }else if(!tried){ setTried(true); setBusy(false); await run(); return; }
    }catch{ if(!tried){ setTried(true); setBusy(false); await run(); return; } }
    setBusy(false);
  }
  return <button className="btn btn-xs" onClick={run} disabled={busy}>{busy? 'Hazırlanıyor...' : 'Oluştur & İndir'}</button>;
}


