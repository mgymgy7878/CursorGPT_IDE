'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

function MiniPnL({ series }: { series?: { ts: number; equity: number }[] }) {
  if (!series || series.length === 0) return null;
  const data = series.map((d) => ({ x: d.ts, y: d.equity }));
  return (
    <div className="h-16 mb-3">
      <div className="text-xs text-gray-600 mb-1">PnL Trend</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} stroke="#10b981" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PositionsTable({ rows }: { rows: any[] }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<any>(null);

  async function dryClose(pos: any) {
    await fetch('/api/copilot/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'positions/close',
        params: { symbol: pos?.symbol },
        dryRun: true,
        confirm_required: true,
        reason: 'dry-run close from home',
      }),
    });
  }

  return (
    <div className="h-full rounded-xl border p-3">
      <div className="mb-2 font-medium">Pozisyonlar</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-neutral-900">
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-2">Symbol</th>
              <th className="py-2 pr-2">Side</th>
              <th className="py-2 pr-2">Size</th>
              <th className="py-2 pr-2">UPnL</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((r, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSel(r);
                  setOpen(true);
                }}
              >
                <td className="py-2 pr-2">{r.symbol}</td>
                <td className="py-2 pr-2">{r.side}</td>
                <td className="py-2 pr-2">{r.qty ?? r.size}</td>
                <td
                  className={`py-2 pr-2 ${r.upnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {r.upnl?.toFixed(2) ?? '—'}
                </td>
                <td className="py-2 pr-2 text-gray-400">
                  <Info size={16} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-4 text-gray-400" colSpan={5}>
                  Pozisyon yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        open={open}
        title={`Position • ${sel?.symbol ?? ''}`}
        onClose={() => setOpen(false)}
      >
        {Array.isArray(sel?.equitySeries) && <MiniPnL series={sel?.equitySeries} />}
        <pre className="text-xs p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 overflow-x-auto">
          {JSON.stringify(sel, null, 2)}
        </pre>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => dryClose(sel)}
            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm"
          >
            Dry-Run Close
          </button>
          <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg border text-sm">
            Kapat
          </button>
        </div>
      </Modal>
    </div>
  );
}

