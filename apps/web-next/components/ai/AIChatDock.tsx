// apps/web-next/components/ai/AIChatDock.tsx
'use client';
import React, { useEffect, useRef, useState } from "react";

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

export default function AIChatDock() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem('ai:thread') ?? '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ try { localStorage.setItem('ai:thread', JSON.stringify(msgs)); } catch {} }, [msgs]);
  useEffect(()=>{ scrollRef.current?.scrollTo({ top: 999999 }); }, [msgs, open]);

  // Quick command relay from CommandPalette
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai:quick'); if (!raw) return;
      const q = JSON.parse(raw);
      if (q?.prompt) {
        setOpen(true);
        setMsgs(m => [...m, { role:'user', content: q.prompt }]);
        localStorage.removeItem('ai:quick');
        handleSend(q.prompt);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput('');
    setBusy(true);
    const next = [...msgs, { role: 'user' as const, content }];
    setMsgs(next);
    try {
      const res = await fetch('/api/public/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ messages: next.slice(-10) }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = (data?.reply ?? fallbackReply(content));
      setMsgs(m => [...m, { role:'assistant', content: reply }]);
    } catch {
      setMsgs(m => [...m, { role:'assistant', content: fallbackReply(content) }]);
    } finally { setBusy(false); }
  }

  function fallbackReply(q: string) {
    // Minimal yerel akıl: "route" ve "task" tek tıklama önerileri
    if (/backtest/i.test(q)) return 'Backtest başlatmak için /backtest sayfasını açtım. CSV yükleyebilir veya Executor Job modunu kullanabilirsiniz. Ayrıca "Use as Template" ile Strategy Lab\'e aktarabilirsiniz.';
    if (/alert/i.test(q)) return 'Alert oluşturmak için Dashboard → Panels → Alerts sekmesini kullanın. Kind: price/volume/rsi/macd, repeats ve tags alanlarını doldurun.';
    if (/strategy|param/i.test(q)) return 'Strategy Lab\'de "Prompt → Suggest → ParamDiff → Review & Apply" akışını izleyin. Risk seviyesini seçip High için approval kilidini kullanın.';
    return 'İsteğinizi anladım. İlgili sayfaya yönlendirebilir, template hazırlayabilir veya mevcut panellere bağlayabilirim.';
  }

  return (
    <>
      <button onClick={()=>setOpen(v=>!v)}
        className="fixed right-3 bottom-3 z-[65] px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950/80 backdrop-blur text-sm hover:bg-zinc-900"
        title="AI asistanı aç/kapat">🤖 Chat</button>
      {!open ? null : (
        <div className="fixed right-3 bottom-14 z-[65] w-[360px] max-h-[60vh] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
          <header className="px-3 py-2 border-b border-zinc-800 text-sm flex items-center justify-between">
            <div>AI Assistant</div>
            <div className="text-[10px] text-zinc-500">Claude 4.1 (proxy)</div>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-auto p-2 space-y-2 text-[12px]">
            {msgs.map((m, i)=>(
              <div key={i} className={`px-2 py-1 rounded ${m.role==='assistant' ? 'bg-zinc-800' : 'bg-zinc-950 border border-zinc-800'}`}>
                <div className="text-[10px] text-zinc-500 mb-0.5">{m.role}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </div>
          <footer className="p-2 border-t border-zinc-800 flex gap-1">
            <input
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) handleSend(); }}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent outline-none px-2 py-1 rounded border border-zinc-700 text-sm" />
            <button disabled={busy} onClick={()=>handleSend()}
              className="px-2 py-1 rounded border border-emerald-700 hover:bg-emerald-900/20 disabled:opacity-50">Send</button>
          </footer>
        </div>
      )}
    </>
  );
} 