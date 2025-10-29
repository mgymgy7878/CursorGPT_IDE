"use client";

import { useStrategyLabStore } from "@/stores/strategyLabStore";

export default function BacktestTab() {
  const { backtestResults, setBacktestResults, setActiveTab } = useStrategyLabStore();

  const handleRunBacktest = () => {
    // TODO: Call backtest API
    console.log("Running backtest...");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Backtest</h2>
        <p className="text-sm text-zinc-500">
          Stratejinizi geçmiş verilerle test edin, performans metriklerini görün.
        </p>
      </div>

      {/* Dataset selector */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Sembol</label>
          <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg">
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Zaman Dilimi</label>
          <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg">
            <option>1h</option>
            <option>4h</option>
            <option>1d</option>
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleRunBacktest}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Backtest Çalıştır
        </button>
        <button
          onClick={() => setActiveTab("optimize")}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          Optimizasyona Geç
        </button>
      </div>

      {/* Results */}
      {backtestResults && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900 rounded-lg">
            <div className="text-xs text-zinc-500">Sharpe Ratio</div>
            <div className="text-2xl font-semibold">
              {backtestResults.sharpe?.toFixed(2) || "-"}
            </div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg">
            <div className="text-xs text-zinc-500">Win Rate</div>
            <div className="text-2xl font-semibold">
              {backtestResults.winRate
                ? `${(backtestResults.winRate * 100).toFixed(1)}%`
                : "-"}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-zinc-600">
        💡 İpucu: Daha uzun periyotlar daha güvenilir sonuçlar verir.
      </div>
    </div>
  );
}

