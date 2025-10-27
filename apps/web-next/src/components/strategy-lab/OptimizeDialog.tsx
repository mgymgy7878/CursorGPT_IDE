// apps/web-next/src/components/strategy-lab/OptimizeDialog.tsx
"use client";
import { useEffect, useState } from "react";
import type { OptimizeParams, OptimizeResult } from "@/types/backtest";

export default function OptimizeDialog({
  open, onClose, onResult, defaultParam = "window",
}: {
  open: boolean;
  onClose: () => void;
  onResult: (res: OptimizeResult) => void;
  defaultParam?: string;
}) {
  const [param, setParam] = useState(defaultParam);
  const [start, setStart] = useState(5);
  const [end, setEnd] = useState(30);
  const [step, setStep] = useState(5);
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (!open) return; setParam(defaultParam); setStart(5); setEnd(30); setStep(5); }, [open, defaultParam]);

  async function run() {
    setLoading(true);
    try {
      const r = await fetch("/api/exec/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ params: { param, start, end, step } as OptimizeParams }),
      });
      const json = await r.json();
      onResult(json as OptimizeResult);
      onClose();
    } finally { setLoading(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Optimize</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm sm:col-span-2">
            <div className="mb-1 text-gray-600">Parametre</div>
            <input className="w-full rounded-xl border px-3 py-2" value={param} onChange={(e)=>setParam(e.target.value)} />
          </label>
          <Num label="Başlangıç" value={start} setValue={setStart} />
          <Num label="Bitiş" value={end} setValue={setEnd} />
          <Num label="Adım" value={step} setValue={setStep} />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-xl border px-3 py-2">İptal</button>
          <button onClick={run} disabled={loading} className="rounded-xl border bg-gray-900 text-white px-3 py-2">
            {loading ? "Çalışıyor..." : "Başlat"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Num({ label, value, setValue }: { label:string; value:number; setValue:(n:number)=>void }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <input
        type="number"
        className="w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e)=>setValue(Number(e.target.value))}
      />
    </label>
  );
}
