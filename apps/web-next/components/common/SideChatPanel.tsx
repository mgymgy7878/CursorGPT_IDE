"use client";
import React, { useEffect, useRef, useState } from "react";

type Msg = { role: 'user'|'assistant'|'system'; content: string; ts: number };
type Template = { label: string; prompt: string };

export default function SideChatPanel({
  title,
  storageKey,
  apiPath,
  placeholder='Bir şey yazın…',
  headerExtra,
  templates=[],
  resizable=true,
  minWidth=280,
  maxWidth=560,
}: {
  title: string;
  storageKey: string;
  apiPath: string;
  placeholder?: string;
  headerExtra?: React.ReactNode;
  templates?: Template[];
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { return []; }
  });
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  // ⭐ yıldızlar ve yalnız-⭐ görünüm (kalıcı)
  const starsKey = `${storageKey}:stars`;
  const starsOnlyKey = `${storageKey}:starsOnly`;
  const [starSet, setStarSet] = useState<Set<number>>(() => {
    try { return new Set<number>(JSON.parse(localStorage.getItem(starsKey) ?? '[]')); } catch { return new Set<number>(); }
  });
  const [starsOnly, setStarsOnly] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem(starsOnlyKey) ?? 'false'); } catch { return false; }
  });
  // panel genişlik/çökük durumu (kalıcı)
  const wKey = `${storageKey}:w`;
  const cKey = `${storageKey}:collapsed`;
  const [width, setWidth] = useState<number>(() => {
    const v = Number(localStorage.getItem(wKey));
    return Number.isFinite(v) && v > minWidth ? v : 360;
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem(cKey) ?? 'false'); } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(msgs)); } catch {} }, [msgs, storageKey]);
  useEffect(() => { endRef.current?.scrollIntoView({ block:'end' }); }, [msgs, busy]);
  useEffect(() => { try { localStorage.setItem(wKey, String(width)); } catch {} }, [width]);
  useEffect(() => { try { localStorage.setItem(cKey, JSON.stringify(collapsed)); } catch {} }, [collapsed]);
  useEffect(() => { try { localStorage.setItem(starsKey, JSON.stringify(Array.from(starSet))); } catch {} }, [starSet]);
  useEffect(() => { try { localStorage.setItem(starsOnlyKey, JSON.stringify(starsOnly)); } catch {} }, [starsOnly]);

  const canSend = input.trim().length > 0 && !busy;
  async function onSend() {
    const text = input.trim(); if (!text) return;
    setBusy(true); setInput('');
    const userMsg: Msg = { role:'user', content: text, ts: Date.now() };
    setMsgs(m => [...m, userMsg]);
    try {
      const res = await fetch(apiPath, { method:'POST', cache:'no-store', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messages: [...msgs, userMsg].slice(-24) }) });
      if (!res.ok) throw new Error('offline');
      const ct = res.headers.get('content-type') || '';
      // Basit akış desteği: text/event-stream | ndjson | text/plain
      if ((ct.includes('event-stream') || ct.includes('ndjson') || ct.includes('text/plain')) && res.body) {
        const reader = res.body.getReader(); const dec = new TextDecoder();
        let acc = '';
        setMsgs(m => [...m, { role: 'assistant', content: '', ts: Date.now() }]);
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          acc += dec.decode(value, { stream:true });
          const clean = acc.replace(/^data:\s*/gm,'');
          setMsgs(m => {
            const next = m.slice();
            const last: { role: 'user'|'assistant'|'system'; content: string; ts: number } | undefined = next[next.length-1];
            if (last && last.role==='assistant') {
              next[next.length-1] = { ...last, content: clean };
            }
            return next;
          });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const text = (data?.reply ?? data?.content ?? data?.message ?? '—').toString();
        setMsgs(m => [...m, { role: 'assistant', content: text, ts: Date.now() }]);
      }
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: '(offline) Yanıt alınamadı. Daha sonra tekrar deneyin.', ts: Date.now() }]);
    } finally { setBusy(false); }
  }
  // ⭐ helpers
  function toggleStar(ts: number) {
    setStarSet(s => {
      const n = new Set(s);
      n.has(ts) ? n.delete(ts) : n.add(ts);
      return n;
    });
  }
  function onClearThread() {
    if (!msgs.length) return;
    if (window.confirm('Tüm sohbeti temizlemek istediğinize emin misiniz?')) {
      setMsgs([]); setCopiedIdx(null); setEditingIdx(null); setStarSet(new Set());
    }
  }
  function onDeleteLast() {
    if (!msgs.length) return;
    const last = msgs[msgs.length - 1]!;
    setMsgs(m => m.slice(0, -1));
    setStarSet(s => { const n = new Set(s); n.delete(last.ts); return n; });
  }
  async function onRetryLast() {
    const lastUser = [...msgs].reverse().find(m => m.role === 'user');
    if (!lastUser || busy) return;
    setInput(lastUser.content);
    await onSend();
  }
  function copyMsg(i: number, text: string) {
    navigator.clipboard?.writeText(text).then(()=>{
      setCopiedIdx(i);
      setTimeout(()=> setCopiedIdx(p => (p === i ? null : p)), 1200);
    }).catch(()=>{ /* sessiz */ });
  }
  // Inline düzenleme (yalnız user)
  function startEdit(i: number) {
    if (msgs[i]?.role !== 'user') return;
    setEditingIdx(i);
    setEditingText(msgs[i].content);
  }
  function cancelEdit() {
    setEditingIdx(null);
    setEditingText('');
  }
  async function saveEdit(sendNow: boolean) {
    if (editingIdx == null) return;
    setMsgs(m => {
      const n = m.slice();
      const existing = n[editingIdx];
      if (!existing) return m;
      n[editingIdx] = { ...existing, content: editingText };
      return n;
    });
    const textToSend = editingText;
    setEditingIdx(null);
    setEditingText('');
    if (sendNow) {
      setInput(textToSend);
      await onSend();
    }
  }
  // minimal fenced code renderer (XSS-safe)
  function renderRich(text: string) {
    if (!text.includes('```')) return <div className="whitespace-pre-wrap">{text}</div>;
    const out: Array<{ kind:'text'|'code'; lang?: string; body: string }> = [];
    let rest = text;
    while (true) {
      const start = rest.indexOf('```'); if (start < 0) { out.push({ kind:'text', body: rest }); break; }
      const after = rest.slice(start + 3);
      const nl = after.indexOf('\n'); const lang = nl >= 0 ? after.slice(0, nl).trim() : '';
      const bodyStart = start + 3 + (nl >= 0 ? nl + 1 : 0);
      const end = rest.indexOf('```', bodyStart);
      if (end < 0) { out.push({ kind:'text', body: rest }); break; }
      const before = rest.slice(0, start);
      const code = rest.slice(bodyStart, end);
      if (before) out.push({ kind:'text', body: before });
      out.push({ kind:'code', lang, body: code });
      rest = rest.slice(end + 3);
    }
    return (
      <div className="space-y-2">
        {out.map((seg, i) => seg.kind === 'text'
          ? <div key={i} className="whitespace-pre-wrap">{seg.body}</div>
          : (
            <pre key={i} className="rounded-lg bg-zinc-950/70 border border-zinc-800 p-2 overflow-auto text-[11px] leading-5">
              <div className="mb-1 text-[10px] text-zinc-500">{seg.lang || 'code'}</div>
              <code className="font-mono">{seg.body}</code>
            </pre>
          )
        )}
      </div>
    );
  }
  // Export helpers
  function download(name: string, data: string, type='text/plain') {
    const blob = new Blob([data], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }
  function exportJSONAll() {
    download(`${title.replace(/\s+/g,'_').toLowerCase()}_thread.json`, JSON.stringify(msgs, null, 2), 'application/json');
  }
  function exportMD(onlyStarred=false) {
    const pick = onlyStarred ? msgs.filter(m=>starSet.has(m.ts)) : msgs;
    const md = [
      `# ${title} — Chat Export`,
      `> ${new Date().toLocaleString()}`,
      ''
    ].concat(pick.map(m=>`- **${m.role}** ${new Date(m.ts).toLocaleTimeString()}\n\n${'```'}\n${m.content}\n${'```'}`)).join('\n');
    download(`${title.replace(/\s+/g,'_').toLowerCase()}_${onlyStarred?'stars_':''}thread.md`, md, 'text/markdown');
  }
  const visible = starsOnly ? msgs.filter(m=>starSet.has(m.ts)) : msgs;

  // Resize drag handlers
  function onDragStart(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startWidth = width;
    function onMove(me: MouseEvent) {
      const dx = me.clientX - startX;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth + dx));
      setWidth(next);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    e.preventDefault();
  }

  if (collapsed) {
    return (
      <aside aria-label={`${title} sohbet paneli (kapalı)`} className="w-[28px] border-l border-zinc-800 bg-zinc-900 flex flex-col">
        <button
          title="Paneli aç"
          className="h-full text-xl text-zinc-400 hover:text-zinc-200"
          onClick={()=>setCollapsed(false)}
        >🤖</button>
      </aside>
    );
  }
  return (
    <aside style={{ width }} className="max-w-[90vw] border-l border-zinc-800 bg-zinc-900 flex flex-col relative" aria-label={`${title} sohbet paneli`}>
      {resizable && (
        <div
          onMouseDown={onDragStart}
          title="Sürükleyerek genişliği ayarla"
          className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-zinc-700/30"
          aria-hidden
        />
      )}
      <header className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="text-sm text-zinc-200">{title}</div>
        <div className="flex items-center gap-2">
          {/* ⭐ filtre toggle */}
          <button
            onClick={()=>setStarsOnly(v=>!v)}
            className={`px-2 py-0.5 rounded border text-xs ${starsOnly ? 'border-amber-700 text-amber-300' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
            title="Yalnız yıldızlı mesajları göster"
          >⭐ {starSet.size}</button>
          {/* Export menüsü */}
          <details className="relative">
            <summary className="list-none px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer select-none">⤓ Export</summary>
            <div className="absolute right-0 mt-1 z-10 min-w-[220px] rounded border border-zinc-800 bg-zinc-900 shadow-lg p-1">
              <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-xs" onClick={()=>exportMD(false)} title="Markdown (tümü)">Markdown (.md)</button>
              <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-xs" onClick={exportJSONAll} title="JSON (tümü)">JSON</button>
              <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-xs" onClick={()=>exportMD(true)} title="Markdown (yalnız ⭐)">Markdown (⭐)</button>
            </div>
          </details>
          {!!templates.length && (
            <details className="relative">
              <summary className="list-none px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 cursor-pointer select-none">Prompts</summary>
              <div className="absolute right-0 mt-1 z-10 min-w-[200px] rounded border border-zinc-800 bg-zinc-900 shadow-lg p-1">
                {templates.map((t,i)=>(
                  <button key={i} className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-xs"
                    onClick={()=>setInput(prev => (prev ? prev+'\n' : '') + t.prompt)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </details>
          )}
          <button
            onClick={()=>setCollapsed(true)}
            className="px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-400 hover:bg-zinc-800"
            title="Paneli daralt"
          >⫶</button>
          <button
            onClick={onRetryLast}
            disabled={!msgs.some(m=>m.role==='user') || busy}
            className="px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
            title="Son kullanıcı mesajını yeniden gönder"
          >↻ Retry</button>
          <button
            onClick={onDeleteLast}
            disabled={!msgs.length}
            className="px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
            title="Son mesajı sil"
          >⌫ Sil Son</button>
          <button
            onClick={onClearThread}
            disabled={!msgs.length}
            className="px-2 py-0.5 rounded border border-rose-700 text-xs text-rose-300 hover:bg-rose-900/20 disabled:opacity-50"
            title="Tüm sohbeti temizle"
          >🧹 Temizle</button>
          {headerExtra}
        </div>
      </header>
      <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
        {visible.map((m, i) => {
          const realIdx = msgs.findIndex(x => x.ts === m.ts);
          const starred = starSet.has(m.ts);
          const isEditing = editingIdx === realIdx;
          return (
            <div key={m.ts} className={`group relative text-[12px] leading-relaxed ${m.role==='user' ? 'text-zinc-100' : 'text-zinc-300'}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="text-[10px] text-zinc-500">{m.role} • {new Date(m.ts).toLocaleTimeString()}</div>
                <button
                  className={`ml-1 text-[10px] px-1 py-0.5 rounded border ${starred ? 'border-amber-700 text-amber-300' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                  onClick={()=>toggleStar(m.ts)}
                  title={starred ? 'Yıldızı kaldır' : 'Yıldızla'}
                >⭐</button>
                <details className="ml-auto opacity-0 group-hover:opacity-100 transition">
                  <summary className="list-none px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900/80 text-[10px] text-zinc-400 hover:bg-zinc-800 cursor-pointer">⋯</summary>
                  <div className="absolute right-0 mt-1 z-10 min-w-[160px] rounded border border-zinc-800 bg-zinc-900 shadow-lg p-1" role="menu" aria-label="Mesaj menüsü">
                    <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[11px]" onClick={()=>copyMsg(realIdx, m.content)} title="Kopyala">Kopyala</button>
                    {m.role==='user' && (
                      <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[11px]" onClick={()=>startEdit(realIdx)} title="Düzenle">Düzenle…</button>
                    )}
                    <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[11px]" onClick={()=>{ setInput(m.content); onSend(); }} title="Yeniden gönder">Yeniden Gönder</button>
                    <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[11px]" onClick={()=>{ setMsgs(arr=>{ const n=arr.filter(x=>x.ts!==m.ts); return n; }); setStarSet(s=>{ const n=new Set(s); n.delete(m.ts); return n; }); }} title="Sil">Sil</button>
                    <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[11px]" onClick={()=>toggleStar(m.ts)} title={starred?'Yıldızı kaldır':'Yıldızla'}>{starred?'Yıldızı Kaldır':'Yıldızla'}</button>
                  </div>
                </details>
              </div>
              {!isEditing ? (
                renderRich(m.content)
              ) : (
                <div className="border border-zinc-800 rounded-lg p-2 space-y-2">
                  <textarea value={editingText} onChange={(e)=>setEditingText(e.target.value)} className="w-full h-28 bg-transparent outline-none text-[12px]" />
                  <div className="flex items-center gap-2">
                    <button onClick={cancelEdit} className="px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-400 hover:bg-zinc-800">Vazgeç</button>
                    <button onClick={()=>saveEdit(false)} className="px-2 py-0.5 rounded border border-emerald-700 text-xs text-emerald-300 hover:bg-emerald-900/20">Kaydet</button>
                    <button onClick={()=>saveEdit(true)} className="px-2 py-0.5 rounded border border-sky-700 text-xs text-sky-300 hover:bg-sky-900/20">Kaydet & Gönder</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <footer className="p-2 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <input
            aria-label="Mesaj yaz"
            className="flex-1 px-2 py-1 rounded border border-zinc-700 bg-transparent text-sm"
            placeholder={placeholder}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if (e.key==='Enter' && (e.metaKey || e.ctrlKey)) onSend(); }}
          />
          <button disabled={!canSend} onClick={onSend}
            className="px-2 py-1 rounded border border-emerald-700 text-emerald-300 disabled:opacity-50 hover:bg-emerald-900/20">
            Gönder ⌘⏎
          </button>
        </div>
        <div className="mt-1 text-[10px] text-zinc-500 flex items-center justify-between">
          <span>Geçmiş yereldir • {busy ? 'Yanıt bekleniyor…' : 'Hazır'}</span>
          <span className="tabular-nums">{input.length ? `chars:${input.length}` : ''}</span>
        </div>
      </footer>
    </aside>
  );
} 