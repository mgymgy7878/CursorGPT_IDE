'use client';
import {useEffect,useState} from 'react';

type Quick = { cpu: string; hits: string; ts: string };

export default function MetricsPreview() {
  const [q, setQ] = useState<Quick | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const text = await fetch("/api/public/metrics/prom", { cache: "no-store" }).then(r => r.text());
        if (!alive) return;

        // örnek iki metrik: process_cpu_seconds_total ve spark_ui_hits_total
        const cpu = /process_cpu_seconds_total\s+([0-9\.\-eE+]+)/.exec(text)?.[1] ?? "—";
        const hits = /spark_ui_hits_total\s+([0-9\.\-eE+]+)/.exec(text)?.[1] ?? "0";
        setQ({ cpu, hits, ts: new Date().toLocaleTimeString("tr-TR") });
      } catch {
        setQ(null);
      } finally {
        if (alive) setTimeout(tick, 5000);
      }
    };
    tick();
    return () => { alive = false; };
  }, []);
  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="rounded-xl border border-white/10 p-4">
        <div className="text-sm opacity-70">Real-time Metrics</div>
        {q ? (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Metric label="CPU seconds" value={q.cpu} />
            <Metric label="UI hits" value={q.hits} />
            <div className="col-span-2 text-xs opacity-60">Son güncelleme: {q.ts}</div>
          </div>
        ) : (
          <div className="opacity-70 mt-2">Veri bekleniyor…</div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-lg">{value}</div>
    </div>
  );
}
