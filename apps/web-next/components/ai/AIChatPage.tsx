// apps/web-next/components/ai/AIChatPage.tsx
'use client';
import React, { useEffect, useState } from "react";
import AIChatDock from "./AIChatDock";

export default function AIChatPage() {
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai:quick');
      if (raw) {
        const q = JSON.parse(raw);
        setHint(q?.prompt ?? null);
      }
    } catch {}
  }, []);
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-2 text-sm text-zinc-400">AI Assistant — Full Page</div>
      {hint && <div className="mb-2 text-[12px] text-zinc-400">Quick prompt: <span className="text-zinc-200">{hint}</span></div>}
      <div className="rounded-xl border border-zinc-800 p-2">
        <p className="text-sm mb-2">Bu sayfa, altta sağdaki Chat dock ile aynı thread'i kullanır. Komut paletinden (⌘K) kısa yolları deneyin.</p>
      </div>
      <AIChatDock />
    </div>
  );
} 