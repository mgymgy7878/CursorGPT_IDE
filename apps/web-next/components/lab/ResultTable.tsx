"use client";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface BacktestStats {
  sharpe: number;
  pnl: number;
  winRate: number;
  maxDD: number;
  trades: number;
}

interface OptimizationResult {
  params: {
    fastMA: number;
    slowMA: number;
  };
  stats: BacktestStats;
}

interface ResultTableProps {
  backtestResult?: BacktestStats;
  optimizationResults?: OptimizationResult[];
  type: "backtest" | "optimization";
}

export default function ResultTable({ backtestResult, optimizationResults, type }: ResultTableProps) {
  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? "text-green-400" : "text-red-400";
  };

  const getSharpeColor = (sharpe: number) => {
    if (sharpe >= 1.5) return "text-green-400";
    if (sharpe >= 1.0) return "text-blue-400";
    if (sharpe >= 0.5) return "text-amber-400";
    return "text-red-400";
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "text-green-400";
    if (winRate >= 50) return "text-blue-400";
    if (winRate >= 40) return "text-amber-400";
    return "text-red-400";
  };

  if (type === "backtest" && backtestResult) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Backtest Results</h3>
          <Activity className="w-5 h-5 text-blue-400" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-neutral-800/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-neutral-400">Sharpe Ratio</span>
            </div>
            <div className={`text-2xl font-bold ${getSharpeColor(backtestResult.sharpe)}`}>
              {backtestResult.sharpe.toFixed(3)}
            </div>
          </div>

          <div className="p-4 bg-neutral-800/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-400">Total P&L</span>
            </div>
            <div className={`text-2xl font-bold ${getPnlColor(backtestResult.pnl)}`}>
              ${backtestResult.pnl.toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-neutral-800/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-neutral-400">Win Rate</span>
            </div>
            <div className={`text-2xl font-bold ${getWinRateColor(backtestResult.winRate)}`}>
              {backtestResult.winRate.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 bg-neutral-800/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-neutral-400">Max Drawdown</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {backtestResult.maxDD.toFixed(2)}%
            </div>
          </div>

          <div className="p-4 bg-neutral-800/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-neutral-400">Total Trades</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {backtestResult.trades}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-neutral-800/20 rounded-lg">
          <h4 className="text-sm font-medium mb-3">Performance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">Risk-Adjusted Return:</span>
              <span className={`ml-2 font-medium ${getSharpeColor(backtestResult.sharpe)}`}>
                {backtestResult.sharpe >= 1.5 ? "Excellent" : 
                 backtestResult.sharpe >= 1.0 ? "Good" : 
                 backtestResult.sharpe >= 0.5 ? "Fair" : "Poor"}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Profitability:</span>
              <span className={`ml-2 font-medium ${getPnlColor(backtestResult.pnl)}`}>
                {backtestResult.pnl >= 0 ? "Profitable" : "Loss"}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Trade Success:</span>
              <span className={`ml-2 font-medium ${getWinRateColor(backtestResult.winRate)}`}>
                {backtestResult.winRate >= 60 ? "High" : 
                 backtestResult.winRate >= 50 ? "Medium" : "Low"}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Risk Level:</span>
              <span className={`ml-2 font-medium ${backtestResult.maxDD <= 10 ? "text-green-400" : 
                backtestResult.maxDD <= 20 ? "text-amber-400" : "text-red-400"}`}>
                {backtestResult.maxDD <= 10 ? "Low" : 
                 backtestResult.maxDD <= 20 ? "Medium" : "High"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "optimization" && optimizationResults) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Optimization Results (Top 5)</h3>
          <Activity className="w-5 h-5 text-purple-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 font-medium">Rank</th>
                <th className="text-left py-2 font-medium">Fast MA</th>
                <th className="text-left py-2 font-medium">Slow MA</th>
                <th className="text-right py-2 font-medium">Sharpe</th>
                <th className="text-right py-2 font-medium">P&L</th>
                <th className="text-right py-2 font-medium">Win Rate</th>
                <th className="text-right py-2 font-medium">Max DD</th>
                <th className="text-right py-2 font-medium">Trades</th>
              </tr>
            </thead>
            <tbody>
              {optimizationResults.map((result, index) => (
                <tr key={index} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      index === 0 ? "bg-yellow-900 text-yellow-200" :
                      index === 1 ? "bg-gray-700 text-gray-200" :
                      index === 2 ? "bg-amber-900 text-amber-200" :
                      "bg-neutral-700 text-neutral-300"
                    }`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="py-2 font-mono">{result.params.fastMA}</td>
                  <td className="py-2 font-mono">{result.params.slowMA}</td>
                  <td className={`py-2 text-right font-medium ${getSharpeColor(result.stats.sharpe)}`}>
                    {result.stats.sharpe.toFixed(3)}
                  </td>
                  <td className={`py-2 text-right font-medium ${getPnlColor(result.stats.pnl)}`}>
                    ${result.stats.pnl.toFixed(2)}
                  </td>
                  <td className={`py-2 text-right font-medium ${getWinRateColor(result.stats.winRate)}`}>
                    {result.stats.winRate.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right font-medium text-red-400">
                    {result.stats.maxDD.toFixed(2)}%
                  </td>
                  <td className="py-2 text-right font-medium">
                    {result.stats.trades}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-neutral-800/20 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Best Parameters</h4>
          <div className="text-sm text-neutral-400">
            Fast MA: {optimizationResults[0]?.params.fastMA}, 
            Slow MA: {optimizationResults[0]?.params.slowMA} 
            (Sharpe: {optimizationResults[0]?.stats.sharpe.toFixed(3)})
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Results</h3>
        <Activity className="w-5 h-5 text-neutral-400" />
      </div>
      <div className="text-center py-8 text-neutral-400">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No results to display</p>
      </div>
    </div>
  );
} 