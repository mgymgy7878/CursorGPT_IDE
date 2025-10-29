"use client";

import { useStrategyLabStore } from "@/stores/strategyLabStore";

export default function OptimizeTab() {
  const { optimizationLeaderboard, bestParams, setBestParams, setActiveTab } =
    useStrategyLabStore();

  const handleOptimize = () => {
    // TODO: Call optimization API
    console.log("Running optimization...");
  };

  const handleDeployBest = () => {
    if (bestParams) {
      setActiveTab("deploy");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Optimizasyon</h2>
        <p className="text-sm text-zinc-500">
          Parametreleri optimize edin, en iyi sonuçları bulun.
        </p>
      </div>

      {/* Optimization method */}
      <div>
        <label className="block text-sm font-medium mb-2">Yöntem</label>
        <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg">
          <option>Grid Search</option>
          <option>Bayesian Optimization</option>
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleOptimize}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Optimizasyonu Başlat
        </button>
        <button
          onClick={handleDeployBest}
          disabled={!bestParams}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
        >
          En İyi → Dağıt
        </button>
      </div>

      {/* Leaderboard */}
      {optimizationLeaderboard.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Liderlik Tablosu</h3>
          <div className="space-y-2">
            {optimizationLeaderboard.slice(0, 10).map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xs text-zinc-500">#{idx + 1}</div>
                  <div className="text-sm">Sharpe: {item.sharpe?.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => setBestParams(item)}
                  className="text-xs text-blue-500 hover:text-blue-400"
                >
                  Seç
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-zinc-600">
        💡 İpucu: Grid Search daha kapsamlı, Bayesian daha hızlıdır.
      </div>
    </div>
  );
}

