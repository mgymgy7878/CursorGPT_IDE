"use client";

import { useStrategyLabStore } from "@/stores/strategyLabStore";

export default function GenerateTab() {
  const { strategyPrompt, setStrategyPrompt, setActiveTab } = useStrategyLabStore();

  const handleGenerate = () => {
    // TODO: Call AI API to generate strategy
    console.log("Generating strategy:", strategyPrompt);
    // After generation, move to backtest tab
    // setActiveTab("backtest");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">AI ile Strateji Üret</h2>
        <p className="text-sm text-zinc-500">
          Trading stratejinizi doğal dille tarif edin, AI sizin için kod üretsin.
        </p>
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium mb-2">
          Strateji Açıklaması
        </label>
        <textarea
          id="prompt"
          value={strategyPrompt}
          onChange={(e) => setStrategyPrompt(e.target.value)}
          placeholder="Örnek: BTCUSDT 1h EMA crossover stratejisi, 10 günlük EMA 20 günlük EMA'yı yukarı kestiğinde al..."
          className="w-full h-32 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={!strategyPrompt.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
        >
          Üret
        </button>
        <button
          onClick={() => setActiveTab("backtest")}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          Backtest'e Geç
        </button>
      </div>

      <div className="text-xs text-zinc-600">
        💡 İpucu: Ne kadar detaylı anlatırsanız, AI o kadar iyi strateji üretir.
      </div>
    </div>
  );
}

