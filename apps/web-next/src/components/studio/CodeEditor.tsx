"use client";
import { useEffect, useState } from "react";
import { readBestParams } from "./StudioBus";

const defaultCode = `// Strategy Template (editable)
export const config = {
  indicators: { emaFast: 20, emaSlow: 50, atr: 14 },
  entry: { type: 'crossUp', fast: 'EMA', slow: 'EMA' },
  exit: { atrMult: 2, takeProfitRR: 1.5 },
  feesBps: 5, slippageBps: 1
};`;

interface CodeEditorProps {
  initialCode?: string | null;
}

export default function CodeEditor({ initialCode }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode || defaultCode);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    const p = readBestParams();
    if (p) applyParams(p);
    const fn = (e: any) => applyParams(e?.detail ?? {});
    window.addEventListener("studio:bestParams", fn as any);
    return () => window.removeEventListener("studio:bestParams", fn as any);
  }, []);

  function applyParams(p: any) {
    if (!p) return;
    const fast = p.emaFast ?? 20;
    const slow = p.emaSlow ?? 50;
    const next = code.replace(
      /(indicators:\s*\{\s*emaFast:\s*)(\d+)(,\s*emaSlow:\s*)(\d+)/m,
      `$1${fast}$3${slow}`
    );
    setCode(next);
  }

  return (
    <div className="card p-4 border border-neutral-800 rounded-xl bg-black/30">
      <h2 className="text-xl mb-2">Code</h2>
      <textarea
        className="w-full h-64 rounded bg-black/40 border border-neutral-800 font-mono text-xs p-3"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <div className="muted text-xs mt-1">
        Optimizer’da “Best’i Uygula” ile emaFast/emaSlow değerleri içeri
        yazılır.
      </div>
    </div>
  );
}
