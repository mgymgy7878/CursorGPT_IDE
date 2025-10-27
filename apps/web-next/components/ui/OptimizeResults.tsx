"use client";
import { useState } from "react";

interface OptimizeResult {
  params: Record<string, number>;
  metrics: {
    sharpeRatio: number;
    totalPnL: number;
    winRate: number;
  };
}

interface OptimizeResultsProps {
  results: OptimizeResult[] | null;
  loading: boolean;
  error: string | null;
}

export default function OptimizeResults({ results, loading, error }: OptimizeResultsProps) {
  const [sortBy, setSortBy] = useState<"sharpe" | "pnl" | "winrate">("sharpe");

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-neutral-700 rounded"></div>
            <div className="h-4 bg-neutral-700 rounded w-5/6"></div>
            <div className="h-4 bg-neutral-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-800 p-6 bg-red-900/20">
        <div className="text-red-400 font-medium mb-2">Optimize Error</div>
        <div className="text-red-300 text-sm">{error}</div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 p-6">
        <div className="text-neutral-400 text-center">Optimize sonuçları burada gösterilecek...</div>
      </div>
    );
  }

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "sharpe":
        return b.metrics.sharpeRatio - a.metrics.sharpeRatio;
      case "pnl":
        return b.metrics.totalPnL - a.metrics.totalPnL;
      case "winrate":
        return b.metrics.winRate - a.metrics.winRate;
      default:
        return 0;
    }
  });

  const topResult = sortedResults[0];

  return (
    <div className="rounded-2xl border border-neutral-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Optimize Results</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("sharpe")}
            className={`px-3 py-1 rounded text-xs ${
              sortBy === "sharpe" 
                ? "bg-neutral-100 text-neutral-900" 
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Sort by Sharpe
          </button>
          <button
            onClick={() => setSortBy("pnl")}
            className={`px-3 py-1 rounded text-xs ${
              sortBy === "pnl" 
                ? "bg-neutral-100 text-neutral-900" 
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Sort by P&L
          </button>
          <button
            onClick={() => setSortBy("winrate")}
            className={`px-3 py-1 rounded text-xs ${
              sortBy === "winrate" 
                ? "bg-neutral-100 text-neutral-900" 
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Sort by Win Rate
          </button>
        </div>
      </div>

      {/* Best Result */}
      <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mb-6">
        <div className="text-green-400 font-medium mb-2">Best Parameters</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(topResult.params).map(([key, value]) => (
            <div key={key}>
              <div className="text-xs text-neutral-400 uppercase">{key}</div>
              <div className="text-lg font-semibold text-neutral-200">{value}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-xs text-neutral-400 uppercase">Sharpe</div>
            <div className="text-lg font-semibold text-green-400">
              {topResult.metrics.sharpeRatio.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 uppercase">P&L</div>
            <div className={`text-lg font-semibold ${topResult.metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${topResult.metrics.totalPnL.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 uppercase">Win Rate</div>
            <div className="text-lg font-semibold text-neutral-200">
              {(topResult.metrics.winRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left p-2 text-neutral-400">Rank</th>
              {Object.keys(topResult.params).map(key => (
                <th key={key} className="text-left p-2 text-neutral-400">{key}</th>
              ))}
              <th className="text-left p-2 text-neutral-400">Sharpe</th>
              <th className="text-left p-2 text-neutral-400">P&L</th>
              <th className="text-left p-2 text-neutral-400">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.slice(0, 20).map((result, index) => (
              <tr key={index} className="border-b border-neutral-800">
                <td className="p-2 text-neutral-300">{index + 1}</td>
                {Object.values(result.params).map((value, i) => (
                  <td key={i} className="p-2 text-neutral-300">{value}</td>
                ))}
                <td className="p-2 text-neutral-300">{result.metrics.sharpeRatio.toFixed(2)}</td>
                <td className={`p-2 font-medium ${result.metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${result.metrics.totalPnL.toFixed(2)}
                </td>
                <td className="p-2 text-neutral-300">{(result.metrics.winRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 