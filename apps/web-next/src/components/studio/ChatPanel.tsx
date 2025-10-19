"use client";
import { useState } from "react";

export default function ChatPanel(){
  const [input,setInput]=useState("");
  const [messages,setMessages]=useState<{role:"user"|"assistant",content:string}[]>([]);

  async function send(){
    const msg=input.trim();
    if(!msg) return;
    setInput("");
    setMessages(m=>[...m,{role:"user",content:msg}]);
    // Placeholder: backende bağlanıldığında SSE ile güncellenecek
    const reply = `Taslak strateji: EMA(${20}) / EMA(${50}) çaprazı, ATR(14)`;
    setMessages(m=>[...m,{role:"assistant",content:reply}]);
  }

  return (
    <div className="card p-4 border border-neutral-800 rounded-xl bg-black/30">
      <h2 className="text-xl mb-2">Chat</h2>
      <div className="space-y-2 max-h-[320px] overflow-auto text-sm">
        {messages.map((m,i)=> (
          <div key={i} className={m.role==='user'?"text-right":"text-left"}>
            <span className="px-3 py-2 inline-block rounded bg-neutral-800/60">{m.content}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Strateji isteğini yazın" className="flex-1 p-2 rounded bg-black/40 border border-neutral-800"/>
        <button onClick={send} className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800">Gönder</button>
      </div>
    </div>
  );
}


