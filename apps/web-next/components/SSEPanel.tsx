import React, { useEffect, useMemo, useRef, useState } from "react";

type Row = { type: string; text: string };

export function SSEPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filters, setFilters] = useState<Record<string, boolean>>({
    heartbeat: true,
    progress: true,
    'ai-decision': true,
    'optimize-start': true,
    'optimize-progress': true,
    'optimize-best': true,
    'optimize-finish': true
  });
  const esRef = useRef<EventSource | null>(null);

  const onToggle = (k: string) => setFilters(f => ({ ...f, [k]: !f[k] }));

  useEffect(() => {
    const es = new EventSource('/api/logs/sse');
    esRef.current = es;

    const push = (type: string, data: any) => {
      const line = typeof data === 'string' ? data : JSON.stringify(data);
      setRows(r => [...r, { type, text: line }].slice(-200));
    };

    const bind = (ev: string) => (msg: MessageEvent) => push(ev, safeParse((msg as any).data));
    const safeParse = (s: string) => { try { return JSON.parse(s) } catch { return s } };

    es.addEventListener('heartbeat', bind('heartbeat'));
    es.addEventListener('progress', bind('progress'));
    es.addEventListener('ai-decision', bind('ai-decision'));
    es.addEventListener('optimize-start', bind('optimize-start'));
    es.addEventListener('optimize-progress', bind('optimize-progress'));
    es.addEventListener('optimize-best', bind('optimize-best'));
    es.addEventListener('optimize-finish', bind('optimize-finish'));

    es.onerror = () => { es.close(); };

    return () => {
      ['heartbeat','progress','ai-decision','optimize-start','optimize-progress','optimize-best','optimize-finish']
        .forEach(n => es.removeEventListener(n, bind(n)));
      es.close();
      esRef.current = null;
    };
  }, []);

  const visible = useMemo(() => rows.filter(r => filters[r.type] ?? true), [rows, filters]);
  const color = (t: string) =>
    t === 'ai-decision' ? '#0ea5e9'
    : t === 'optimize-best' ? '#10b981'
    : t === 'optimize-finish' ? '#7c3aed'
    : t.includes('progress') ? '#1e40af'
    : '#64748b';

  return (
    <div className="panel" style={{ padding: 8 }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', marginBottom:8 }}>
        <strong style={{ opacity:.8 }}>SSE</strong>
        {Object.keys(filters).map(k => (
          <label key={k} className="chip" style={{ cursor:'pointer', opacity: filters[k] ? 1 : .5 }}>
            <input type="checkbox" checked={filters[k]} onChange={()=>onToggle(k)} style={{ marginRight:6 }} />
            {k}
          </label>
        ))}
      </div>
      <div style={{ maxHeight: 220, overflow: 'auto', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:12 }}>
        {visible.map((r, i) => (
          <div key={i}><span style={{ color: color(r.type), fontWeight:600 }}>{r.type}</span> <span>{typeof r.text === 'string' ? r.text : JSON.stringify(r.text)}</span></div>
        ))}
      </div>

      <style jsx global>{`
        .chip { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid rgba(0,0,0,.08); background:#fff }
      `}</style>
    </div>
  );
}

export default SSEPanel; 
