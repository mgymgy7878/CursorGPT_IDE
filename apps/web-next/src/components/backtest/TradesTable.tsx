"use client";
import { useState } from 'react';

type Trade = {
  id: string | number;
  timestamp: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
};

type Props = {
  trades: Trade[];
};

export default function TradesTable({ trades }: Props) {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  if (!trades || trades.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-6 text-center opacity-50">
        Trade verisi yok
      </div>
    );
  }

  const totalPages = Math.ceil(trades.length / pageSize);
  const startIdx = page * pageSize;
  const endIdx = Math.min(startIdx + pageSize, trades.length);
  const displayTrades = trades.slice(startIdx, endIdx);

  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Trade Detayları</h3>
        <div className="text-sm opacity-70">
          Toplam: {trades.length} trade
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="p-2 text-left text-xs opacity-70">Tarih</th>
              <th className="p-2 text-left text-xs opacity-70">Sembol</th>
              <th className="p-2 text-left text-xs opacity-70">Yön</th>
              <th className="p-2 text-right text-xs opacity-70">Giriş</th>
              <th className="p-2 text-right text-xs opacity-70">Çıkış</th>
              <th className="p-2 text-right text-xs opacity-70">PnL</th>
              <th className="p-2 text-right text-xs opacity-70">%</th>
            </tr>
          </thead>
          <tbody>
            {displayTrades.map((t) => (
              <tr key={t.id} className="border-b border-neutral-900 hover:bg-neutral-900/50">
                <td className="p-2 text-xs opacity-70">
                  {new Date(t.timestamp).toLocaleString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-2 font-mono">{t.symbol}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${t.side === 'LONG' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {t.side}
                  </span>
                </td>
                <td className="p-2 text-right font-mono">${t.entryPrice.toFixed(2)}</td>
                <td className="p-2 text-right font-mono">${t.exitPrice.toFixed(2)}</td>
                <td className={`p-2 text-right font-semibold ${t.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}
                </td>
                <td className={`p-2 text-right font-semibold ${t.pnlPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded-lg border border-neutral-700 text-sm disabled:opacity-30 hover:bg-neutral-800"
          >
            ← Önceki
          </button>
          <div className="text-xs opacity-70">
            Sayfa {page + 1} / {totalPages} ({startIdx + 1}-{endIdx} / {trades.length})
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1 rounded-lg border border-neutral-700 text-sm disabled:opacity-30 hover:bg-neutral-800"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}

