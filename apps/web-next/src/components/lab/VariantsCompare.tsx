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
  onPromote?: (variant: Variant, index: number) => void;
};

export default function VariantsCompare({ variants, baseline, onPromote }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set([0]));
  const [batchMode, setBatchMode] = useState(false);
  
  if (!variants || variants.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
        <h3 className="text-sm font-semibold mb-3">📊 Varyant Karşılaştırma</h3>
        <div className="text-center py-8 text-neutral-500 text-sm">
          Optimizasyon sonucu bekleniyor...
        </div>
      </div>
    );
  }

  const selected = variants[selectedIdx];
  
  function toggleSelection(idx: number) {
    const newSet = new Set(selectedIndices);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setSelectedIndices(newSet);
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">📊 Varyant Karşılaştırma</h3>
        <button
          onClick={() => setBatchMode(!batchMode)}
          className={`text-xs px-2 py-1 rounded ${
            batchMode ? "bg-blue-500 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {batchMode ? "Tekli Mod" : "Çoklu Seçim"}
        </button>
      </div>
      
      {/* Variant Selector */}
      {batchMode ? (
        <div className="mb-4">
          <label className="block text-xs text-neutral-500 mb-2">
            Varyantlar ({selectedIndices.size} seçili)
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {variants.map((v, idx) => (
              <label key={idx} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-neutral-800/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedIndices.has(idx)}
                  onChange={() => toggleSelection(idx)}
                  className="form-checkbox"
                />
                <span>
                  #{idx + 1} - Return: {v.metrics.totalReturn.toFixed(2)}% / Sharpe: {v.metrics.sharpeRatio.toFixed(2)}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-xs text-neutral-500 mb-2">Varyant Seçimi</label>
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(parseInt(e.target.value))}
            className="inp w-full"
          >
            {variants.map((v, idx) => (
              <option key={idx} value={idx}>
                #{idx + 1} - Return: {v.metrics.totalReturn.toFixed(2)}% / Sharpe: {v.metrics.sharpeRatio.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="px-2 py-2 text-left text-neutral-500">Metrik</th>
              {baseline && <th className="px-2 py-2 text-right text-neutral-500">Baseline</th>}
              <th className="px-2 py-2 text-right text-neutral-500">Seçili</th>
              {baseline && <th className="px-2 py-2 text-right text-neutral-500">Fark</th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-neutral-800">
              <td className="px-2 py-2 text-neutral-400">Total Return</td>
              {baseline && (
                <td className="px-2 py-2 text-right font-mono">
                  {baseline.metrics.totalReturn.toFixed(2)}%
                </td>
              )}
              <td className="px-2 py-2 text-right font-mono font-semibold text-green-400">
                {selected.metrics.totalReturn.toFixed(2)}%
              </td>
              {baseline && (
                <td className={`px-2 py-2 text-right font-mono ${
                  selected.metrics.totalReturn > baseline.metrics.totalReturn ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(selected.metrics.totalReturn - baseline.metrics.totalReturn >= 0 ? '+' : '')}
                  {(selected.metrics.totalReturn - baseline.metrics.totalReturn).toFixed(2)}%
                </td>
              )}
            </tr>
            <tr className="border-b border-neutral-800">
              <td className="px-2 py-2 text-neutral-400">Win Rate</td>
              {baseline && (
                <td className="px-2 py-2 text-right font-mono">
                  {baseline.metrics.winRate.toFixed(2)}%
                </td>
              )}
              <td className="px-2 py-2 text-right font-mono font-semibold text-blue-400">
                {selected.metrics.winRate.toFixed(2)}%
              </td>
              {baseline && (
                <td className={`px-2 py-2 text-right font-mono ${
                  selected.metrics.winRate > baseline.metrics.winRate ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(selected.metrics.winRate - baseline.metrics.winRate >= 0 ? '+' : '')}
                  {(selected.metrics.winRate - baseline.metrics.winRate).toFixed(2)}%
                </td>
              )}
            </tr>
            <tr className="border-b border-neutral-800">
              <td className="px-2 py-2 text-neutral-400">Sharpe Ratio</td>
              {baseline && (
                <td className="px-2 py-2 text-right font-mono">
                  {baseline.metrics.sharpeRatio.toFixed(2)}
                </td>
              )}
              <td className="px-2 py-2 text-right font-mono font-semibold text-purple-400">
                {selected.metrics.sharpeRatio.toFixed(2)}
              </td>
              {baseline && (
                <td className={`px-2 py-2 text-right font-mono ${
                  selected.metrics.sharpeRatio > baseline.metrics.sharpeRatio ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(selected.metrics.sharpeRatio - baseline.metrics.sharpeRatio >= 0 ? '+' : '')}
                  {(selected.metrics.sharpeRatio - baseline.metrics.sharpeRatio).toFixed(2)}
                </td>
              )}
            </tr>
            {(selected.metrics.maxDrawdown !== undefined || baseline?.metrics.maxDrawdown !== undefined) && (
              <tr className="border-b border-neutral-800">
                <td className="px-2 py-2 text-neutral-400">Max Drawdown</td>
                {baseline && (
                  <td className="px-2 py-2 text-right font-mono text-orange-400">
                    {baseline.metrics.maxDrawdown?.toFixed(2) ?? '-'}%
                  </td>
                )}
                <td className="px-2 py-2 text-right font-mono font-semibold text-orange-400">
                  {selected.metrics.maxDrawdown?.toFixed(2) ?? '-'}%
                </td>
                {baseline && baseline.metrics.maxDrawdown !== undefined && selected.metrics.maxDrawdown !== undefined && (
                  <td className={`px-2 py-2 text-right font-mono ${
                    selected.metrics.maxDrawdown < baseline.metrics.maxDrawdown ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(selected.metrics.maxDrawdown - baseline.metrics.maxDrawdown >= 0 ? '+' : '')}
                    {(selected.metrics.maxDrawdown - baseline.metrics.maxDrawdown).toFixed(2)}%
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Parameters */}
      <div className="mt-4 pt-4 border-t border-neutral-800">
        <div className="text-xs text-neutral-500 mb-2">Parametreler</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(selected.params).map(([key, value]) => (
            <div key={key} className="flex justify-between px-2 py-1 bg-neutral-800/50 rounded">
              <span className="text-neutral-400">{key}:</span>
              <span className="font-mono text-neutral-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Promote Button */}
      {onPromote && (
        <div className="mt-4 pt-4 border-t border-neutral-800">
          {batchMode ? (
            <button
              onClick={() => {
                const selectedVariants = Array.from(selectedIndices).map(idx => variants[idx]);
                if (selectedVariants.length === 0) {
                  return; // Button already disabled
                }
                // Trigger batch promote via special index = -1
                (onPromote as any)(selectedVariants, -1);
              }}
              disabled={selectedIndices.size === 0}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              title={selectedIndices.size === 0 ? "En az 1 varyant seçin" : ""}
            >
              {selectedIndices.size === 0 
                ? "📌 Varyant Seçin" 
                : `💾 ${selectedIndices.size} Varyantı Toplu Kaydet`}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onPromote(selected, selectedIdx)}
                className="btn btn-primary flex-1"
              >
                💾 Taslak Olarak Kaydet
              </button>
              <button
                onClick={() => {
                  if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
                }}
                disabled={selectedIdx === 0}
                className="btn btn-secondary"
              >
                ← Önceki
              </button>
              <button
                onClick={() => {
                  if (selectedIdx < variants.length - 1) setSelectedIdx(selectedIdx + 1);
                }}
                disabled={selectedIdx === variants.length - 1}
                className="btn btn-secondary"
              >
                Sonraki →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

