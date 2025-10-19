"use client";
import { useState } from "react";

type Variant = {
  params: Record<string, number | string>;
  metrics: {
    totalReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown?: number;
  };
};

type Props = {
  variants: Variant[];
  baseline?: Variant;
};

export default function VariantsMatrix({ variants, baseline }: Props) {
  const [sortBy, setSortBy] = useState<"totalReturn" | "sharpeRatio" | "winRate">("totalReturn");

  if (!variants || variants.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
        <h3 className="text-sm font-semibold mb-3">🔥 Varyant Matrisi</h3>
        <div className="text-center py-8 text-neutral-500 text-sm">
          Optimizasyon sonucu bekleniyor...
        </div>
      </div>
    );
  }

  const sorted = [...variants].sort((a, b) => b.metrics[sortBy] - a.metrics[sortBy]);
  const top5 = sorted.slice(0, 5);

  // Calculate min/max for heatmap
  const allReturns = variants.map(v => v.metrics.totalReturn);
  const minReturn = Math.min(...allReturns);
  const maxReturn = Math.max(...allReturns);

  function getHeatmapColor(value: number) {
    if (maxReturn === minReturn) return "bg-neutral-800";
    const normalized = (value - minReturn) / (maxReturn - minReturn);
    if (normalized > 0.8) return "bg-green-500/30 border-green-500/50";
    if (normalized > 0.6) return "bg-green-500/20 border-green-500/30";
    if (normalized > 0.4) return "bg-yellow-500/20 border-yellow-500/30";
    if (normalized > 0.2) return "bg-orange-500/20 border-orange-500/30";
    return "bg-red-500/20 border-red-500/30";
  }

  function exportCSV() {
    const headers = ["Rank", "Total Return %", "Win Rate %", "Sharpe", "Max DD %", ...Object.keys(variants[0].params)];
    const rows = sorted.map((v, idx) => [
      idx + 1,
      v.metrics.totalReturn.toFixed(2),
      v.metrics.winRate.toFixed(2),
      v.metrics.sharpeRatio.toFixed(2),
      v.metrics.maxDrawdown?.toFixed(2) ?? "-",
      ...Object.values(v.params)
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `optimization-matrix-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">🔥 Varyant Matrisi (Top 5)</h3>
        <button
          onClick={exportCSV}
          className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
        >
          📊 CSV İndir
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-neutral-500 mb-1">Sıralama</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="inp text-xs"
        >
          <option value="totalReturn">Total Return</option>
          <option value="sharpeRatio">Sharpe Ratio</option>
          <option value="winRate">Win Rate</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-right">Return</th>
              <th className="px-2 py-2 text-right">Win %</th>
              <th className="px-2 py-2 text-right">Sharpe</th>
              {top5[0]?.metrics.maxDrawdown !== undefined && (
                <th className="px-2 py-2 text-right">DD</th>
              )}
              {Object.keys(top5[0].params).map((key) => (
                <th key={key} className="px-2 py-2 text-right">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top5.map((variant, idx) => (
              <tr
                key={idx}
                className={`border-b border-neutral-800 hover:bg-neutral-800/50 ${getHeatmapColor(variant.metrics.totalReturn)}`}
              >
                <td className="px-2 py-2 font-semibold text-blue-400">#{idx + 1}</td>
                <td className={`px-2 py-2 text-right font-mono ${
                  variant.metrics.totalReturn >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {variant.metrics.totalReturn.toFixed(2)}%
                </td>
                <td className="px-2 py-2 text-right font-mono">
                  {variant.metrics.winRate.toFixed(2)}%
                </td>
                <td className="px-2 py-2 text-right font-mono text-purple-400">
                  {variant.metrics.sharpeRatio.toFixed(2)}
                </td>
                {variant.metrics.maxDrawdown !== undefined && (
                  <td className="px-2 py-2 text-right font-mono text-orange-400">
                    {variant.metrics.maxDrawdown.toFixed(2)}%
                  </td>
                )}
                {Object.values(variant.params).map((value, i) => (
                  <td key={i} className="px-2 py-2 text-right font-mono text-neutral-400">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {baseline && (
        <div className="mt-3 pt-3 border-t border-neutral-800 text-xs">
          <div className="text-neutral-500 mb-1">Baseline:</div>
          <div className="flex gap-4 font-mono text-neutral-400">
            <span>Return: {baseline.metrics.totalReturn.toFixed(2)}%</span>
            <span>Win: {baseline.metrics.winRate.toFixed(2)}%</span>
            <span>Sharpe: {baseline.metrics.sharpeRatio.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="mt-3 text-center text-xs text-neutral-500">
        Toplam {variants.length} varyant · Heatmap: Return bazlı
      </div>
    </div>
  );
}

