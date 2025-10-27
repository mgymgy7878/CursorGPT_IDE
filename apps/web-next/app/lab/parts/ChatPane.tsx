"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPane({
  getCode, setCode
}: { getCode: ()=>string; setCode: (s:string)=>void }) {

  const [msgs, setMsgs] = useState<Msg[]>([
    { role:"assistant",
      content:'Merhaba! "EMA 34/89 yap, ATR trailing stop ekle" gibi yaz; üstte mesajlar listelenir. Alt sağdaki alandan gönder.' }
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // her mesajda en alta kay
  useEffect(()=>{
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;
    const user = { role:"user", content: input.trim() } as Msg;
    setMsgs((m)=>[...m, user]);
    setInput("");

    // API: mevcut kodu da bağlama olarak gönder
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ prompt: user.content, code: getCode() })
      });
      const data = await res.json();
      const text = data?.message ?? "⚠️ AI yanıtı alınamadı.";
      setMsgs((m)=>[...m, { role:"assistant", content: text }]);

      // Yanıtta ```ts ...``` bloğu varsa editöre uygula
      const match = /```(?:ts|typescript|js|javascript)?\n([\s\S]*?)```/m.exec(text);
      if (match?.[1]) setCode(match[1]);
    } catch {
      setMsgs((m)=>[...m, { role:"assistant", content: "⚠️ Ağ hatası." }]);
    }
  }

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      {/* Başlık */}
      <header className="px-3 py-2 border-b border-neutral-800 font-semibold">AI Chat</header>

      {/* Mesajlar — ÜSTTE, kendi içinde scroll eder */}
      <div ref={listRef} className="min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {msgs.map((m,i)=>(
          <div key={i}
               className={m.role==="user"
                 ? "bg-emerald-900/30 border border-emerald-700/50 rounded px-3 py-2"
                 : "bg-neutral-800/50 border border-neutral-700/50 rounded px-3 py-2"}>
            <b>{m.role==="user"?"Sen":"AI"}:</b> <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
      </div>

      {/* GİRİŞ — SAĞ ALTA sabit (grid'in alt satırı) */}
      <form onSubmit={onSend} className="p-3 border-t border-neutral-800">
        <div className="flex gap-2">
          <input
            className="flex-1 input"
            placeholder="İsteğini yaz..."
            value={input}
            onChange={(e)=>setInput(e.target.value)}
          />
          <button className="btn-primary" type="submit">Gönder</button>
        </div>
      </form>
    </div>
  );
}
