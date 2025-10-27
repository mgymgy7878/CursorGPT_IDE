"use client";
import React from "react";
import { useUIStore } from "@/stores/uiStore";
import { useLabStore } from "@/stores/labStore";

type Msg = { role: "user" | "assistant"; text: string; ts: number };

export default function CopilotPanel() {
  const copilotOpen = useUIStore((s) => s.copilotOpen);
  const toggleCopilot = useUIStore((s) => s.toggleCopilot);
  const [input, setInput] = React.useState("");
  const [msgs, setMsgs] = React.useState<Msg[]>([
    {
      role: "assistant",
      text: "Merhaba, Copilot hazır. Strateji veya piyasa sorularını yazabilirsin.",
      ts: Date.now(),
    },
  ]);

  const onSend = () => {
    const text = input.trim();
    if (!text) return;
    const now = Date.now();
    setMsgs((m) => [...m, { role: "user", text, ts: now }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "🧠 (Mock) İsteğini aldım. Entegre AI ile yanıt için API anahtarını Ayarlar’dan ekleyebilirsin.",
          ts: Date.now(),
        },
      ]);
    }, 300);
  };

  const appendCode = useLabStore((s) => s.appendCode);
  function extractFirstCodeBlock(t: string) {
    const m = t.match(/```[a-z]*\n([\s\S]*?)```/i);
    return m?.[1]?.trim();
  }

  if (!copilotOpen) return null;

  return (
    <aside className="hidden lg:flex fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-[380px] border-l border-zinc-800 bg-zinc-900/70 backdrop-blur-sm">
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center border-b border-zinc-800 px-2">
          <div className="py-2 text-sm font-medium">AI Copilot</div>
          <button
            onClick={toggleCopilot}
            className="ml-auto text-xs rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
            title="Paneli Kapat"
          >
            Kapat
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {msgs.map((m) => {
            const code = m.role === "assistant" ? extractFirstCodeBlock(m.text) : undefined;
            return (
              <div key={m.ts + m.role} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={[
                    "inline-block rounded-md px-3 py-2 text-sm",
                    m.role === "user" ? "bg-sky-600 text-white" : "bg-zinc-800 text-zinc-200",
                  ].join(" ")}
                >
                  {m.text}
                </div>
                {code && (
                  <div className="mt-1">
                    <button
                      onClick={() => appendCode(code)}
                      className="text-xs underline hover:opacity-80"
                      title="Kodu Strateji Lab editörüne ekle"
                    >
                      Kodu Editöre Ekle
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-2 border-t border-zinc-800 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Soru veya komut yazın…"
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring"
          />
          <button onClick={onSend} className="rounded-md border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800">
            Gönder
          </button>
        </div>
      </div>
    </aside>
  );
}


