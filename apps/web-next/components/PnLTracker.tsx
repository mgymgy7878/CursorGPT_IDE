"use client";
import { useState, useEffect } from "react";

interface PnLSummary {
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  bestPerformer: string;
  worstPerformer: string;
  activePositions: number;
  timestamp: number;
}

interface PnLPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  pnlPercent: number;
  timestamp: number;
}

export default function PnLTracker() {
  const [summary, setSummary] = useState<PnLSummary | null>(null);
  const [positions, setPositions] = useState<PnLPosition[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPnLData() {
    try {
      setLoading(true);
      const r = await fetch("/api/private/pnl/summary");
      const data = await r.json();
      if (r.ok) {
        setSummary(data.data.summary || null);
        setPositions(data.data.positions || []);
      }
    } catch (e) {
      console.error('PnL data error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPnLData();
    const interval = setInterval(loadPnLData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  function formatNumber(num: number, decimals = 2): string {
    return Number(num).toFixed(decimals);
  }

  function formatPercent(num: number): string {
    return `${formatNumber(num)}%`;
  }

  function getPnlColor(pnl: number): string {
    return pnl >= 0 ? 'text-green-600' : 'text-red-600';
  }

  return (
    <div className="p-4 rounded-xl border bg-orange-50 border-orange-200">
      <div className="flex justify-between items-center mb-4">
        <div className="font-semibold text-orange-800">PnL Tracker</div>
        <button
          onClick={loadPnLData}
          disabled={loading}
          className={`px-3 py-1 text-sm rounded ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Total PnL</div>
            <div className={`text-2xl font-bold ${getPnlColor(summary.totalPnl)}`}>
              ${formatNumber(summary.totalPnl)}
            </div>
            <div className="text-xs text-gray-500">
              {formatPercent(summary.totalPnlPercent)}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Daily PnL</div>
            <div className={`text-2xl font-bold ${getPnlColor(summary.dailyPnl)}`}>
              ${formatNumber(summary.dailyPnl)}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Weekly PnL</div>
            <div className={`text-2xl font-bold ${getPnlColor(summary.weeklyPnl)}`}>
              ${formatNumber(summary.weeklyPnl)}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Monthly PnL</div>
            <div className={`text-2xl font-bold ${getPnlColor(summary.monthlyPnl)}`}>
              ${formatNumber(summary.monthlyPnl)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PnL Breakdown */}
        <div className="bg-white rounded border p-4">
          <h4 className="font-medium mb-4">PnL Breakdown</h4>
          {summary && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unrealized PnL:</span>
                <span className={`font-medium ${getPnlColor(summary.totalUnrealizedPnl)}`}>
                  ${formatNumber(summary.totalUnrealizedPnl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Realized PnL:</span>
                <span className={`font-medium ${getPnlColor(summary.totalRealizedPnl)}`}>
                  ${formatNumber(summary.totalRealizedPnl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Positions:</span>
                <span className="font-medium text-blue-600">{summary.activePositions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Best Performer:</span>
                <span className="font-medium text-green-600">{summary.bestPerformer || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Worst Performer:</span>
                <span className="font-medium text-red-600">{summary.worstPerformer || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white rounded border p-4">
          <h4 className="font-medium mb-4">Performance Chart</h4>
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-500">
            Chart placeholder - Performance over time
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="mt-6">
        <h4 className="font-medium mb-4">Active Positions</h4>
        <div className="bg-white rounded border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-left">Side</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-right">Avg Entry</th>
                  <th className="px-4 py-2 text-right">Current</th>
                  <th className="px-4 py-2 text-right">Unrealized PnL</th>
                  <th className="px-4 py-2 text-right">Realized PnL</th>
                  <th className="px-4 py-2 text-right">Total PnL</th>
                  <th className="px-4 py-2 text-right">PnL %</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-gray-500">
                      No active positions
                    </td>
                  </tr>
                ) : (
                  positions.map((position, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{position.symbol}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          position.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {position.side}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{formatNumber(position.quantity, 6)}</td>
                      <td className="px-4 py-2 text-right">${formatNumber(position.avgEntryPrice)}</td>
                      <td className="px-4 py-2 text-right">${formatNumber(position.currentPrice)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${getPnlColor(position.unrealizedPnl)}`}>
                        ${formatNumber(position.unrealizedPnl)}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${getPnlColor(position.realizedPnl)}`}>
                        ${formatNumber(position.realizedPnl)}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${getPnlColor(position.totalPnl)}`}>
                        ${formatNumber(position.totalPnl)}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${getPnlColor(position.pnlPercent)}`}>
                        {formatPercent(position.pnlPercent)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 