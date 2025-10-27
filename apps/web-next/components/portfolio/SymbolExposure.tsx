"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useState } from "react";

interface SymbolExposure {
  symbol: string;
  notional: number;
  qty: number;
  uPnl: number;
  side: "LONG" | "SHORT";
}

interface SymbolExposureProps {
  bySymbol: SymbolExposure[];
}

export default function SymbolExposure({ bySymbol }: SymbolExposureProps) {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  if (!bySymbol || bySymbol.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Symbol Exposure</h3>
          <BarChart3 className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-center py-8 text-neutral-400">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No symbol exposure data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const barData = bySymbol.map(symbol => ({
    symbol: symbol.symbol,
    notional: symbol.notional,
    uPnl: symbol.uPnl,
    side: symbol.side
  }));

  const pieData = bySymbol.map(symbol => ({
    name: symbol.symbol,
    value: symbol.notional,
    side: symbol.side,
    uPnl: symbol.uPnl
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? "#10B981" : "#EF4444";
  };

  const getSideColor = (side: string) => {
    return side === "LONG" ? "#10B981" : "#EF4444";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
          <p className="text-white font-medium">{`Symbol: ${label}`}</p>
          <p className="text-neutral-300">{`Notional: $${data.notional?.toLocaleString() || data.value?.toLocaleString()}`}</p>
          <p className="text-neutral-300">{`P&L: $${data.uPnl?.toFixed(2) || data.uPnl?.toFixed(2)}`}</p>
          <p className="text-neutral-300">{`Side: ${data.side}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Symbol Exposure</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType("bar")}
            className={`p-2 rounded ${chartType === "bar" ? "bg-blue-600" : "bg-neutral-700 hover:bg-neutral-600"}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType("pie")}
            className={`p-2 rounded ${chartType === "pie" ? "bg-purple-600" : "bg-neutral-700 hover:bg-neutral-600"}`}
          >
            <PieChartIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="symbol" 
                stroke="#9CA3AF" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="notional" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-3">Exposure Details</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 font-medium">Symbol</th>
                <th className="text-left py-2 font-medium">Side</th>
                <th className="text-right py-2 font-medium">Notional</th>
                <th className="text-right py-2 font-medium">P&L</th>
                <th className="text-right py-2 font-medium">% of Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {bySymbol.map((symbol) => {
                const totalNotional = bySymbol.reduce((sum, s) => sum + s.notional, 0);
                const percentage = (symbol.notional / totalNotional) * 100;
                
                return (
                  <tr key={symbol.symbol} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="py-2 font-mono font-medium">{symbol.symbol}</td>
                    <td className={`py-2 font-medium ${symbol.side === "LONG" ? "text-green-400" : "text-red-400"}`}>
                      {symbol.side}
                    </td>
                    <td className="py-2 text-right font-mono">${symbol.notional.toLocaleString()}</td>
                    <td className={`py-2 text-right font-mono ${symbol.uPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${symbol.uPnl.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono">{percentage.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
        <span>Chart Type: {chartType === "bar" ? "Bar Chart" : "Pie Chart"}</span>
        <span>Symbols: {bySymbol.length}</span>
      </div>
    </div>
  );
} 