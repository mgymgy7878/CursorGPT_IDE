"use client";
import { useState } from "react";

interface Trade {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  qty: string;
  price: string;
  ts: number;
}

interface EquityPoint {
  date: string;
  equity: number;
}

interface Metrics {
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalPnL: number;
  avgTrade: number;
}

interface BacktestResult {
  equityCurve: EquityPoint[];
  trades: Trade[];
  metrics: Metrics;
  logs: string[];
}

interface BacktestResultsProps {
  result: BacktestResult | null;
  loading: boolean;
  error: string | null;
}

export default function BacktestResults({ result, loading, error }: BacktestResultsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "trades" | "equity">("overview");

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
        <div className="text-red-400 font-medium mb-2">Backtest Error</div>
        <div className="text-red-300 text-sm">{error}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-neutral-800 p-6">
        <div className="text-neutral-400 text-center">Backtest sonuçları burada gösterilecek...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-2 rounded-lg text-sm ${
            activeTab === "overview" 
              ? "bg-neutral-100 text-neutral-900" 
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`px-3 py-2 rounded-lg text-sm ${
            activeTab === "trades" 
              ? "bg-neutral-100 text-neutral-900" 
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Trades ({result.trades.length})
        </button>
        <button
          onClick={() => setActiveTab("equity")}
          className={`px-3 py-2 rounded-lg text-sm ${
            activeTab === "equity" 
              ? "bg-neutral-100 text-neutral-900" 
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Equity Curve
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="text-xs text-neutral-400 uppercase">Total P&L</div>
              <div className={`text-xl font-semibold ${result.metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${result.metrics.totalPnL.toFixed(2)}
              </div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="text-xs text-neutral-400 uppercase">Sharpe Ratio</div>
              <div className="text-xl font-semibold text-neutral-200">
                {result.metrics.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="text-xs text-neutral-400 uppercase">Win Rate</div>
              <div className="text-xl font-semibold text-neutral-200">
                {(result.metrics.winRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="text-xs text-neutral-400 uppercase">Max Drawdown</div>
              <div className="text-xl font-semibold text-red-400">
                {(result.metrics.maxDrawdown * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="text-xs text-neutral-400 uppercase">Total Trades</div>
              <div className="text-xl font-semibold text-neutral-200">
                {result.metrics.totalTrades}
              </div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="text-xs text-neutral-400 uppercase">Avg Trade</div>
              <div className={`text-xl font-semibold ${result.metrics.avgTrade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${result.metrics.avgTrade.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 rounded-lg p-4">
            <div className="text-xs text-neutral-400 uppercase mb-2">Logs</div>
            <div className="space-y-1">
              {result.logs.map((log, i) => (
                <div key={i} className="text-sm text-neutral-300 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "trades" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left p-2 text-neutral-400">ID</th>
                <th className="text-left p-2 text-neutral-400">Symbol</th>
                <th className="text-left p-2 text-neutral-400">Side</th>
                <th className="text-left p-2 text-neutral-400">Qty</th>
                <th className="text-left p-2 text-neutral-400">Price</th>
                <th className="text-left p-2 text-neutral-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {result.trades.map((trade) => (
                <tr key={trade.id} className="border-b border-neutral-800">
                  <td className="p-2 text-neutral-300">{trade.id}</td>
                  <td className="p-2 text-neutral-300">{trade.symbol}</td>
                  <td className={`p-2 font-medium ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.side}
                  </td>
                  <td className="p-2 text-neutral-300">{trade.qty}</td>
                  <td className="p-2 text-neutral-300">${trade.price}</td>
                  <td className="p-2 text-neutral-300">
                    {new Date(trade.ts).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "equity" && (
        <div className="space-y-4">
          <div className="bg-neutral-900/50 rounded-lg p-4">
            <div className="text-xs text-neutral-400 uppercase mb-2">Equity Curve</div>
            <div className="space-y-2">
              {result.equityCurve.slice(-10).map((point, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">{point.date}</span>
                  <span className="text-sm font-medium text-neutral-200">
                    ${point.equity.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 