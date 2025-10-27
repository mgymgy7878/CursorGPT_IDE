"use client";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useLabStore } from '@/stores/labStore';
import NextDynamic from 'next/dynamic';
import BacktestResults from '@/components/backtest/BacktestResults';
import { runBacktest } from '@/lib/api/executor';

const Editor = NextDynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="p-4 text-sm opacity-70">Editor yükleniyor…</div>,
});

export default function LabPage() {
  const code = useLabStore((s) => s.code);
  const [equity, setEquity] = useState<{ t: number; equity: number }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onBacktest = async () => {
    setLoading(true);
    try {
      const res = await runBacktest({ code });
      setEquity(res?.equity ?? null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Yeni Strateji</h2>
        <Editor height="40vh" defaultLanguage="typescript" defaultValue="// strateji kodu…" />
        <div className="mt-3">
          <button onClick={onBacktest} disabled={loading} className="rounded-md border px-3 py-2 text-sm">
            {loading ? 'Çalıştırılıyor…' : 'Backtest Et'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <BacktestResults data={equity} />
      </section>
    </div>
  );
}
