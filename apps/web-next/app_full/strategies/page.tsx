'use client';

import Link from 'next/link';
import { useStrategiesStore } from '@/stores/strategiesStore';

export default function StrategiesPage() {
  const { strategies, runStrategy, backtestStrategy, optimizeStrategy, removeStrategy } =
    useStrategiesStore();

  const groups = strategies.reduce<Record<string, typeof strategies>>((acc, s) => {
    acc[s.category] ??= [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stratejilerim</h1>
        <Link href="/lab" className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500">
          Yeni Strateji Oluştur
        </Link>
      </div>

      {Object.entries(groups).map(([cat, list]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-lg font-medium">{cat}</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.map(s => (
              <div key={s.id} className="rounded-xl bg-slate-800/60 p-4 space-y-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-slate-400">{s.description}</div>
                <div className="flex gap-2">
                  <button onClick={() => runStrategy(s.id)} className="btn-primary">Çalıştır</button>
                  <button onClick={() => backtestStrategy(s.id)} className="btn-secondary">Backtest</button>
                  <button onClick={() => optimizeStrategy(s.id)} className="btn-secondary">Optimizasyon</button>
                  <button onClick={() => removeStrategy(s.id)} className="btn-danger ml-auto">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
