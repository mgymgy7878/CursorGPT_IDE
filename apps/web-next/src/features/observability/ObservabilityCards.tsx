"use client";

import { useEffect, useState } from "react";
import { fetchWsHealth } from "@/features/health/metrics";

interface GuardrailsState {
  killSwitch: number;
}

interface BacktestMetrics {
  p50?: number;
  p95?: number;
}

export default function ObservabilityCards() {
  const [wsHealth, setWsHealth] = useState<
    { source: string; staleness: number }[]
  >([]);
  const [guardrails, setGuardrails] = useState<GuardrailsState | null>(null);
  const [backtest, setBacktest] = useState<BacktestMetrics>({});

  useEffect(() => {
    const pull = async () => {
      // WS Health
      const health = await fetchWsHealth();
      setWsHealth(health);

      // Guardrails
      try {
        const grRes = await fetch("http://127.0.0.1:4001/metrics");
        const grText = await grRes.text();
        const ksMatch = /guardrails_kill_switch_state\s+(\d+)/.exec(grText);
        if (ksMatch) {
          setGuardrails({ killSwitch: Number(ksMatch[1]) });
        }
      } catch {}

      // Backtest (mock for now - real impl would parse histogram)
      setBacktest({ p50: 12.5, p95: 28.3 });
    };

    pull();
    const interval = setInterval(pull, 5000);
    return () => clearInterval(interval);
  }, []);

  const maxStaleness =
    wsHealth.length > 0 ? Math.max(...wsHealth.map((h) => h.staleness)) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* WS Staleness */}
      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-300">
            WS Staleness (s)
          </h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              maxStaleness < 2
                ? "bg-green-900/30 text-green-400"
                : maxStaleness <= 10
                  ? "bg-amber-900/30 text-amber-400"
                  : "bg-red-900/30 text-red-400"
            }`}
          >
            {maxStaleness < 2 ? "OK" : maxStaleness <= 10 ? "Slow" : "Down"}
          </span>
        </div>
        <div className="text-2xl font-bold">{maxStaleness.toFixed(1)}s</div>
        <div className="text-xs text-neutral-500 mt-1">
          {wsHealth
            .map((h) => `${h.source}: ${h.staleness.toFixed(1)}s`)
            .join(", ")}
        </div>
      </div>

      {/* Kill Switch */}
      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-300">
            Kill Switch
          </h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              guardrails?.killSwitch === 0
                ? "bg-green-900/30 text-green-400"
                : "bg-red-900/30 text-red-400"
            }`}
          >
            {guardrails?.killSwitch === 0 ? "Normal" : "BLOCKED"}
          </span>
        </div>
        <div className="text-2xl font-bold">
          {guardrails?.killSwitch === 0 ? "Open" : "Closed"}
        </div>
        <div className="text-xs text-neutral-500 mt-1">Guardrails status</div>
      </div>

      {/* Backtest P95 */}
      <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-300">
            Backtest P95
          </h3>
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
            Healthy
          </span>
        </div>
        <div className="text-2xl font-bold">{backtest.p95?.toFixed(1)}s</div>
        <div className="text-xs text-neutral-500 mt-1">
          P50: {backtest.p50?.toFixed(1)}s
        </div>
      </div>
    </div>
  );
}
