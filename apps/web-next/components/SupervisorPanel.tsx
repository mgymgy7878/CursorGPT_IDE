import React, { useEffect, useState } from "react";

type Stats = { state: string; running: boolean; decisions: number; lastDecision?: { action: string; reason: string; symbol: string; ts: number } };

export default function SupervisorPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => { refresh(); }, []);

  function refresh() {
    fetch('/api/supervisor/stats').then(r=>r.json()).then(j=>setStats(j.data));
  }
  function toggle(run?: boolean) {
    fetch('/api/admin/supervisor/toggle', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ run }) })
      .then(r=>r.json()).then(()=>refresh());
  }

  useEffect(() => {
    const es = new EventSource('/api/logs/sse');
    const onDecision = (ev: MessageEvent) => setLines(p => [...p, `ai-decision ${ev.data}`].slice(-100));
    es.addEventListener('ai-decision', onDecision as any);
    es.addEventListener('heartbeat', (() => {}) as any);
    return () => { es.removeEventListener('ai-decision', onDecision as any); es.close(); };
  }, []);

  return (
    <div style={{ display:'grid', gap:12 }}>
      <div className="panel" style={{ padding: 12, display:'flex', gap:12, alignItems:'center' }}>
        <button className="btn primary" onClick={()=>toggle(true)}>Başlat</button>
        <button className="btn" onClick={()=>toggle(false)}>Durdur</button>
        <button className="btn" onClick={refresh}>Yenile</button>
        <div style={{ marginLeft:'auto' }}>
          Durum: <strong>{stats?.running ? 'Çalışıyor' : 'Durdu'}</strong> — State: {stats?.state} — Karar: {stats?.decisions ?? 0}
        </div>
      </div>
      <div className="panel" style={{ padding:12 }}>
        <div style={{ opacity:.7, marginBottom:8 }}>SSE (AI Decisions)</div>
        <div style={{ maxHeight:220, overflow:'auto', fontFamily:'ui-monospace, monospace', fontSize:12 }}>
          {lines.map((l,i)=><div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
} 
