"use client";
import { useState } from "react";
import { useBacktestSSE } from "@/features/backtest/useBacktestSSE";

export default function BacktestRunner() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    symbol: "BTCUSDT",
    timeframe: "1h",
    start: "2024-05-01",
    end: "2024-06-01",
  });

  const { progress, error, fetchReport } = useBacktestSSE(jobId);

  async function run() {
    setLoading(true);
    setJobId(null);
    setReport(null);
    try {
      const r = await fetch("http://localhost:4001/backtest/job", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          symbol: form.symbol,
          timeframe: form.timeframe,
          startDate: form.start,
          endDate: form.end,
        }),
      });
      const data = await r.json();
      setJobId(data.jobId);

      // Wait for completion and fetch report
      setTimeout(async () => {
        const jobProgress = await fetchReport();
        if (jobProgress) {
          setReport(jobProgress);
        }
      }, 15000); // Mock job takes ~15 seconds
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 border border-neutral-800 rounded-xl bg-black/30">
      <h2 className="text-xl mb-2">Backtest Runner</h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
        <input
          className="p-2 rounded bg-black/40 border border-neutral-800 focus:ring-2 focus:ring-blue-500"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          placeholder="Symbol"
          aria-label="Symbol"
        />
        <input
          className="p-2 rounded bg-black/40 border border-neutral-800 focus:ring-2 focus:ring-blue-500"
          value={form.timeframe}
          onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
          placeholder="Timeframe"
          aria-label="Timeframe"
        />
        <input
          className="p-2 rounded bg-black/40 border border-neutral-800 focus:ring-2 focus:ring-blue-500"
          type="date"
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
          aria-label="Start date"
        />
        <input
          className="p-2 rounded bg-black/40 border border-neutral-800 focus:ring-2 focus:ring-blue-500"
          type="date"
          value={form.end}
          onChange={(e) => setForm({ ...form, end: e.target.value })}
          aria-label="End date"
        />
        <button
          onClick={run}
          disabled={loading || !!(progress && progress.status === "running")}
          className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
        >
          {loading || (progress && progress.status === "running")
            ? "Running..."
            : "Run"}
        </button>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">{progress.step}</span>
            <span className="text-neutral-400">{progress.progress}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
              role="progressbar"
              aria-valuenow={progress.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 rounded bg-red-900/30 border border-red-700 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      {report && (
        <div className="space-y-3">
          <h3 className="font-semibold">Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="p-2 rounded bg-neutral-800/50 border border-neutral-700">
              <div className="text-neutral-400">Win Rate</div>
              <div className="text-lg font-bold">
                {(report.metrics.winRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded bg-neutral-800/50 border border-neutral-700">
              <div className="text-neutral-400">Total Return</div>
              <div className="text-lg font-bold">
                {(report.metrics.totalReturn * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded bg-neutral-800/50 border border-neutral-700">
              <div className="text-neutral-400">Sharpe Ratio</div>
              <div className="text-lg font-bold">
                {report.metrics.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div className="p-2 rounded bg-neutral-800/50 border border-neutral-700">
              <div className="text-neutral-400">Max Drawdown</div>
              <div className="text-lg font-bold text-red-400">
                {(report.metrics.maxDrawdown * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
