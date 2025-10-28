"use client";

import { useState } from "react";
import { useStrategyWizardStore } from "./store";
import type { StrategySuggestion } from "./store";

interface StrategyWizardProps {
  onComplete: (code: string) => void;
  onClose: () => void;
}

export default function StrategyWizard({
  onComplete,
  onClose,
}: StrategyWizardProps) {
  const {
    symbol,
    timeframe,
    risk,
    notes,
    suggestions,
    selectedSuggestion,
    setSymbol,
    setTimeframe,
    setRisk,
    setNotes,
    setSuggestions,
    selectSuggestion,
    setGeneratedCode,
  } = useStrategyWizardStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "ADA/USDT"];
  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const risks = [
    {
      value: "conservative" as const,
      label: "Conservative",
      desc: "Low risk, steady returns",
    },
    {
      value: "moderate" as const,
      label: "Moderate",
      desc: "Balanced risk/reward",
    },
    {
      value: "aggressive" as const,
      label: "Aggressive",
      desc: "High risk, high returns",
    },
  ];

  async function generateSuggestions() {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/copilot/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe, risk, notes }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      // Fallback mock suggestions
      setSuggestions([
        {
          id: "1",
          title: "EMA Crossover Strategy",
          description: "Fast and slow EMA crossover with ATR-based stops",
          indicators: ["EMA(20)", "EMA(50)", "ATR(14)"],
          rationale:
            "Classic momentum strategy with volatility-based risk management",
          riskLevel: risk,
        },
        {
          id: "2",
          title: "RSI Overbought/Oversold",
          description: "RSI-based entry with MACD confirmation",
          indicators: ["RSI(14)", "MACD", "Volume"],
          rationale: "Mean reversion strategy with confirmation filters",
          riskLevel: risk,
        },
        {
          id: "3",
          title: "Bollinger Bands Bounce",
          description: "Price bounce from bands with volume filter",
          indicators: ["BB(20,2)", "Volume", "Stochastic"],
          rationale: "Range-bound strategy with momentum confirmation",
          riskLevel: risk,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function createDraft() {
    if (!selectedSuggestion) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/copilot/strategy/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestion: selectedSuggestion,
          symbol,
          timeframe,
          risk,
        }),
      });
      const data = await response.json();
      const code = data.code || generateFallbackCode();
      setGeneratedCode(code);
      onComplete(code);
      onClose();
    } catch (error) {
      console.error("Failed to create draft:", error);
      const code = generateFallbackCode();
      setGeneratedCode(code);
      onComplete(code);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  }

  function generateFallbackCode(): string {
    const indicators =
      selectedSuggestion?.indicators.join(", ") || "EMA(20), EMA(50)";
    return `// ${selectedSuggestion?.title || "Strategy"} (${symbol}, ${timeframe})
export const config = {
  symbol: "${symbol}",
  timeframe: "${timeframe}",
  indicators: { ${indicators} },
  entry: { type: 'crossUp', fast: 'EMA', slow: 'EMA' },
  exit: { atrMult: 2, takeProfitRR: 1.5 },
  feesBps: 5,
  slippageBps: 1,
  riskProfile: "${risk}"
};

export function onTick(data) {
  // ${selectedSuggestion?.description || "Strategy logic"}
  const fast = indicators.EMA(data, 20);
  const slow = indicators.EMA(data, 50);

  if (fast > slow && !isLong) {
    openLong();
  }
  if (fast < slow && isLong) {
    closeLong();
  }
}`;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="border-b border-neutral-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Strategy Generator</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
            aria-label="Close wizard"
          >
            ✕
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="border-b border-neutral-800 p-4 flex gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded ${
                step === currentStep
                  ? "bg-blue-500"
                  : step < currentStep
                    ? "bg-green-500"
                    : "bg-neutral-800"
              }`}
              aria-label={`Step ${step} ${step === currentStep ? "(current)" : step < currentStep ? "(completed)" : ""}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <div
              className="space-y-4"
              role="tabpanel"
              aria-label="Step 1: Strategy Parameters"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 focus:ring-2 focus:ring-blue-500"
                >
                  {symbols.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Timeframe
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 focus:ring-2 focus:ring-blue-500"
                >
                  {timeframes.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Risk Profile
                </label>
                <div className="space-y-2">
                  {risks.map((r) => (
                    <label
                      key={r.value}
                      className="flex items-center gap-3 p-3 rounded bg-neutral-800/50 border border-neutral-700 cursor-pointer hover:bg-neutral-800 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10"
                    >
                      <input
                        type="radio"
                        name="risk"
                        value={r.value}
                        checked={risk === r.value}
                        onChange={() => setRisk(r.value)}
                        className="ring-2 ring-blue-500"
                      />
                      <div>
                        <div className="font-medium">{r.label}</div>
                        <div className="text-xs text-neutral-400">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., prefer mean reversion, focus on volume..."
                  className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div
              className="space-y-4"
              role="tabpanel"
              aria-label="Step 2: Strategy Suggestions"
            >
              {isGenerating ? (
                <div className="text-center py-8">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"
                    aria-label="Loading"
                  ></div>
                  <p className="text-sm text-neutral-400">
                    Generating strategy suggestions...
                  </p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-400 mb-4">
                    No suggestions yet. Click "Generate" to get AI-powered
                    strategies.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => selectSuggestion(suggestion)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedSuggestion?.id === suggestion.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-neutral-700">
                          {suggestion.riskLevel}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {suggestion.indicators.map((ind, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded bg-neutral-700"
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-400">
                        {suggestion.rationale}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div role="tabpanel" aria-label="Step 3: Create Draft">
              {selectedSuggestion ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-800/50">
                    <h3 className="font-semibold mb-2">
                      {selectedSuggestion.title}
                    </h3>
                    <p className="text-sm text-neutral-400">
                      {selectedSuggestion.description}
                    </p>
                  </div>
                  <button
                    onClick={createDraft}
                    disabled={isGenerating}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500"
                  >
                    {isGenerating
                      ? "Creating draft..."
                      : "Create Draft in Strategy Lab"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-400">
                    Please select a strategy first.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-4 flex justify-between gap-3">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
          >
            Previous
          </button>
          {currentStep === 1 && (
            <button
              onClick={() => {
                setCurrentStep(2);
                generateSuggestions();
              }}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Next: Generate Suggestions
            </button>
          )}
          {currentStep === 2 && (
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!selectedSuggestion}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next: Create Draft
            </button>
          )}
          {currentStep === 3 && <div></div>}
        </div>
      </div>
    </div>
  );
}
