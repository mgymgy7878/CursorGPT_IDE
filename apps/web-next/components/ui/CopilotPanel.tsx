"use client";
import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function CopilotPanel({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Merhaba! Strateji fikrini yaz; iskelet kod üretelim." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: content }, { role: "assistant", text: "" }]);
    setLoading(true);

    try {
      const res = await fetch("/api/local/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system: "You are Spark Copilot. Be concise, actionable, code-focused.",
          messages: [
            ...messages.map(({ role, text }) => ({ role, content: text })),
            { role: "user", content },
          ],
        }),
      });

      if (!res.body) throw new Error("no_stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Expect lines like: data: {"token":"..."}\n\n
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.replace(/^data:\s*/, "");
          try {
            const json = JSON.parse(payload);
            if (json.token) {
              assistantText += json.token;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", text: assistantText };
                return copy;
              });
            }
            if (json.done) break;
          } catch {
            // ignore
          }
        }
      }
    } catch (e: any) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", text: `Hata: ${e?.message || "akış başarısız"}` };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 h-10 border-b border-neutral-800">
        <div className="text-sm font-medium">AI Copilot</div>
        <button onClick={onClose} className="text-xs opacity-70 hover:opacity-100">Kapat</button>
      </div>
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === "assistant" ? "text-neutral-200" : "text-neutral-300"}`}>
            <b className="uppercase">{m.role}</b>: {m.text}
          </div>
        ))}
        {loading && <div className="text-xs text-neutral-500">Yanıt akıyor…</div>}
      </div>
      <div className="p-3 border-t border-neutral-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Strateji isteğini yaz..."
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button onClick={send} disabled={loading} className="px-3 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-sm hover:opacity-90 disabled:opacity-50">
          Gönder
        </button>
      </div>
    </div>
  );
} 