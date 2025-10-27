'use client';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import useTimeseriesBuffer from '@/hooks/useTimeseriesBuffer';
import useWebSocketLive from '@/hooks/useWebSocketLive';

export default function KeyMetrics({ metrics }: { metrics: any }) {
  const { data: wsData } = useWebSocketLive<any>('metrics');
  const live = wsData ?? metrics;

  const samples = useTimeseriesBuffer(
    {
      p95: Number(live?.p95_ms ?? 0),
      err: Number(live?.error_rate ?? 0),
      psi: Number(live?.psi ?? 0),
      mr: Number(live?.match_rate ?? 0),
    },
    { max: 40 }
  );

  const cards = [
    { key: 'p95' as const, label: 'P95 Latency', unit: ' ms', stroke: '#3b82f6' },
    { key: 'err' as const, label: 'Error Rate', unit: '%', stroke: '#ef4444' },
    { key: 'psi' as const, label: 'PSI', unit: '', stroke: '#f59e0b' },
    { key: 'mr' as const, label: 'Match Rate', unit: '%', stroke: '#10b981' },
  ];

  return (
    <div className="h-full rounded-xl border p-3">
      <div className="mb-3 font-medium">Anahtar Metrikler</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
        {cards.map((c) => {
          const v = samples.at(-1)?.[c.key] ?? 0;
          const data = samples.map((s, i) => ({ i, v: s[c.key] }));
          return (
            <div key={c.key} className="h-full rounded-lg border p-2">
              <div className="text-xs text-gray-600">{c.label}</div>
              <div className="text-xl font-semibold mt-1">
                {Number.isFinite(v) ? v.toFixed(2) : '—'}
                {c.unit}
              </div>
              <div className="h-8 mt-2">
                {data.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke={c.stroke}
                        dot={false}
                        strokeWidth={1.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    Loading...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

