"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Position {
  symbol: string;
  qty: number;
  avgPx: number;
  notional: number;
  unrealizedPnl: number;
  side: "LONG" | "SHORT";
}

interface PositionsData {
  positions: Position[];
  summary: {
    totalNotional: number;
    totalPnl: number;
    positionCount: number;
    longPositions: number;
    shortPositions: number;
  };
}

export default function PositionsTable() {
  const [data, setData] = useState<PositionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/public/positions", {
        cache: "no-store",
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      const rows = Array.isArray(result) ? result : (Array.isArray(result?.positions) ? result.positions : []);
      const summary = result?.summary ?? { totalNotional: 0, totalPnl: 0, positionCount: rows.length, longPositions: 0, shortPositions: 0 };
      setData({ positions: rows, summary });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch positions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    
    const interval = setInterval(fetchPositions, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return "text-green-400";
    if (pnl < 0) return "text-red-400";
    return "text-neutral-400";
  };

  const getPnlIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="w-4 h-4" />;
    if (pnl < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const getSideColor = (side: string) => {
    return side === "LONG" ? "text-green-400" : "text-red-400";
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Positions</h3>
        <div className="text-center py-8 text-neutral-400">
          Loading positions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Positions</h3>
        <div className="text-center py-8 text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Positions</h3>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-neutral-400">Auto-refresh 5s</span>
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-neutral-800/30 rounded-lg">
          <div>
            <div className="text-sm text-neutral-400">Total Notional</div>
            <div className="text-lg font-semibold">${data.summary.totalNotional.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Total P&L</div>
            <div className={`text-lg font-semibold ${getPnlColor(data.summary.totalPnl)}`}>
              ${data.summary.totalPnl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Positions</div>
            <div className="text-lg font-semibold">{data.summary.positionCount}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Long/Short</div>
            <div className="text-lg font-semibold">
              <span className="text-green-400">{data.summary.longPositions}</span>
              <span className="text-neutral-400">/</span>
              <span className="text-red-400">{data.summary.shortPositions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Positions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left py-2 font-medium">Symbol</th>
              <th className="text-left py-2 font-medium">Side</th>
              <th className="text-right py-2 font-medium">Quantity</th>
              <th className="text-right py-2 font-medium">Avg Price</th>
              <th className="text-right py-2 font-medium">Notional</th>
              <th className="text-right py-2 font-medium">Unrealized P&L</th>
            </tr>
          </thead>
          <tbody>
            {data?.positions.map((position) => (
              <tr key={position.symbol} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                <td className="py-2 font-mono font-medium">{position.symbol}</td>
                <td className={`py-2 font-medium ${getSideColor(position.side)}`}>
                  {position.side}
                </td>
                <td className="py-2 text-right font-mono">{position.qty}</td>
                <td className="py-2 text-right font-mono">${position.avgPx.toLocaleString()}</td>
                <td className="py-2 text-right font-mono">${position.notional.toLocaleString()}</td>
                <td className={`py-2 text-right font-mono font-medium ${getPnlColor(position.unrealizedPnl)}`}>
                  <div className="flex items-center justify-end space-x-1">
                    {getPnlIcon(position.unrealizedPnl)}
                    <span>${position.unrealizedPnl.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!data || data.positions.length === 0) && (
        <div className="text-center py-8 text-neutral-400">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No positions to display</p>
        </div>
      )}
    </div>
  );
} 