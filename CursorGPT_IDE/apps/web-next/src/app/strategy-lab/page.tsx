"use client";

import { useState } from "react";

interface BacktestResult {
  ok: boolean;
  equity: number;
  cash: number;
  pos: number;
  pnl: number;
  tradeCount: number;
  turnover: number;
  exposure: number;
  maxDD: number;
  sharpe: number;
  winRate: number;
  sameBarFills: number;
  skippedOrders: number;
}

export default function StrategyLab() {
  const [formData, setFormData] = useState({
    symbol: "BTCUSDT",
    tf: "1m",
    from: "2025-08-01",
    to: "2025-09-30",
    initial: 10000,
    feeBps: 10,
    slippageBps: 5,
    strategy: "sma_cross"
  });
  
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strategies = [
    { value: "sma_cross", label: "SMA Cross (10/20)" },
    { value: "rsi_contrarian", label: "RSI Contrarian (14, 30/70)" },
    { value: "breakout", label: "Breakout (20)" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!result?.fills) return;
    
    const csv = [
      'timestamp,price,quantity,fee',
      ...result.fills.map(f => `${f.ts},${f.price},${f.qty},${f.fee}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${formData.symbol}_${formData.strategy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Strategy Lab</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Backtest Configuration</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="BTCUSDT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeframe</label>
                <select
                  value={formData.tf}
                  onChange={(e) => setFormData({...formData, tf: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="1h">1h</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  value={formData.from}
                  onChange={(e) => setFormData({...formData, from: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  value={formData.to}
                  onChange={(e) => setFormData({...formData, to: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Strategy</label>
              <select
                value={formData.strategy}
                onChange={(e) => setFormData({...formData, strategy: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                {strategies.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Initial Capital</label>
                <input
                  type="number"
                  value={formData.initial}
                  onChange={(e) => setFormData({...formData, initial: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fee (bps)</label>
                <input
                  type="number"
                  value={formData.feeBps}
                  onChange={(e) => setFormData({...formData, feeBps: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slippage (bps)</label>
                <input
                  type="number"
                  value={formData.slippageBps}
                  onChange={(e) => setFormData({...formData, slippageBps: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Running Backtest..." : "Run Backtest"}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Cash validation */}
              {result.cash < 0 && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  ⚠️ Invalid: Negative cash detected!
                </div>
              )}

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Final Equity</div>
                  <div className="text-lg font-semibold">${result.equity.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">PnL</div>
                  <div className={`text-lg font-semibold ${result.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${result.pnl.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Max Drawdown</div>
                  <div className="text-lg font-semibold">{(result.maxDD * 100).toFixed(2)}%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Sharpe Ratio</div>
                  <div className="text-lg font-semibold">{result.sharpe.toFixed(3)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Trades</div>
                  <div className="text-lg font-semibold">{result.tradeCount}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Win Rate</div>
                  <div className="text-lg font-semibold">{(result.winRate * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Quality metrics */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Quality Metrics</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Same-bar fills: <span className="font-mono">{result.sameBarFills}</span></div>
                  <div>Skipped orders: <span className="font-mono">{result.skippedOrders}</span></div>
                  <div>Turnover: <span className="font-mono">${result.turnover.toLocaleString()}</span></div>
                  <div>Exposure: <span className="font-mono">${result.exposure.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Download button */}
              {result.fills && result.fills.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Download Trades CSV
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
