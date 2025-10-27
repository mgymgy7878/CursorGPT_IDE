'use client';
import useSWR from 'swr';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
  ResponsiveContainer,
} from 'recharts';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function EquityChartPage() {
  const { data } = useSWR('/api/backtest/artifacts/evidence/backtest/eq_demo.json', fetcher);

  const series = Array.isArray(data) ? data : [];

  function exportCSV() {
    const csv = 'ts,equity\n' + series.map((d) => `${d.ts},${d.equity}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equity.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Equity Curve</h2>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="h-96 rounded-xl border bg-white p-4">
        {series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Veri yok. Backtest çalıştırın.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="ts"
                tickFormatter={(v) => new Date(v).toLocaleTimeString('tr-TR')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(v) => new Date(v).toLocaleString('tr-TR')}
                formatter={(v: any) => [`$${v.toFixed(2)}`, 'Equity']}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#eq)"
              />
              <Brush dataKey="ts" height={30} stroke="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

