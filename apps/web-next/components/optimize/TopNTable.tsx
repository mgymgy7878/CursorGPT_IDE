"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  symbol: string;
  score: number;
  pnl?: number;
  sharpe?: number;
};

export interface TopNTableProps {
  limit?: number;
}

function toCSV(rows: Row[]) {
  const header = ["symbol","score","pnl","sharpe"].join(",");
  const lines = rows.map(r => [r.symbol, r.score, r.pnl ?? "", r.sharpe ?? ""].join(","));
  return [header, ...lines].join("\n");
}

export default function TopNTable({ limit = 10 }: TopNTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/optimize/top?limit=${limit}`)
      .then(r => r.json())
      .then(j => { if (mounted) setRows(j?.items ?? j ?? []); })
      .catch(() => { if (mounted) setRows([]); })
      .finally(() => { if (mounted) setLoading(false); });
  }, [limit]);

  const best = useMemo(() => rows.slice(0, limit), [rows, limit]);

  function download(name: string, data: string, type: string) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() { download("topN.csv", toCSV(best), "text/csv"); }
  function exportJSON() { download("topN.json", JSON.stringify(best, null, 2), "application/json"); }

  return (
    <div className="p-3 rounded-lg border border-gray-700 bg-gray-900">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Top-{limit}</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded bg-gray-700 text-white text-xs" onClick={exportCSV}>CSV</button>
          <button className="px-2 py-1 rounded bg-gray-700 text-white text-xs" onClick={exportJSON}>JSON</button>
        </div>
      </div>
      {loading && <div className="text-xs text-gray-400">Yükleniyor…</div>}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-400 text-left">
            <th className="py-1">Sembol</th>
            <th className="py-1">Skor</th>
            <th className="py-1">PnL</th>
            <th className="py-1">Sharpe</th>
          </tr>
        </thead>
        <tbody>
          {best.map((r, i) => (
            <tr key={i} className="border-t border-gray-800 text-gray-200">
              <td className="py-1 font-mono">{r.symbol}</td>
              <td className="py-1">{r.score.toFixed?.(2) ?? r.score}</td>
              <td className="py-1">{r.pnl ?? "—"}</td>
              <td className="py-1">{r.sharpe ?? "—"}</td>
            </tr>
          ))}
          {!best.length && !loading && (
            <tr><td colSpan={4} className="text-gray-500 py-2">Kayıt yok</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


