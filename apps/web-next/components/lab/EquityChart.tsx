"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface EquityPoint {
  ts: string;
  equity: number;
}

interface EquityChartProps {
  equity: EquityPoint[];
  loading?: boolean;
}

export default function EquityChart({ equity, loading = false }: EquityChartProps) {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Equity Curve</h3>
          <TrendingUp className="w-5 h-5 text-green-400" />
        </div>
        <div className="text-center py-8 text-neutral-400">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading equity data...</p>
        </div>
      </div>
    );
  }

  if (!equity || equity.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Equity Curve</h3>
          <TrendingUp className="w-5 h-5 text-green-400" />
        </div>
        <div className="text-center py-8 text-neutral-400">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No equity data available</p>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = equity.map(point => ({
    time: new Date(point.ts).toLocaleDateString(),
    equity: point.equity
  }));

  // Calculate performance metrics
  const initialEquity = equity[0]?.equity || 10000;
  const finalEquity = equity[equity.length - 1]?.equity || 10000;
  const totalReturn = ((finalEquity - initialEquity) / initialEquity) * 100;
  const maxEquity = Math.max(...equity.map(p => p.equity));
  const minEquity = Math.min(...equity.map(p => p.equity));
  const maxDrawdown = ((maxEquity - minEquity) / maxEquity) * 100;

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Equity Curve</h3>
        <TrendingUp className="w-5 h-5 text-green-400" />
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-neutral-800/30 rounded-lg">
          <div className="text-sm text-neutral-400">Initial Capital</div>
          <div className="text-lg font-semibold">${initialEquity.toLocaleString()}</div>
        </div>
        <div className="p-3 bg-neutral-800/30 rounded-lg">
          <div className="text-sm text-neutral-400">Final Capital</div>
          <div className="text-lg font-semibold">${finalEquity.toLocaleString()}</div>
        </div>
        <div className="p-3 bg-neutral-800/30 rounded-lg">
          <div className="text-sm text-neutral-400">Total Return</div>
          <div className={`text-lg font-semibold ${totalReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalReturn >= 0 ? "+" : ""}{totalReturn.toFixed(2)}%
          </div>
        </div>
        <div className="p-3 bg-neutral-800/30 rounded-lg">
          <div className="text-sm text-neutral-400">Max Drawdown</div>
          <div className="text-lg font-semibold text-red-400">
            {maxDrawdown.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF" 
              fontSize={12}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tick={{ fontSize: 12 }}
              domain={['dataMin - 1000', 'dataMax + 1000']}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value: any) => [`$${value.toLocaleString()}`, 'Equity']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="equity" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
        <span>Data Points: {equity.length}</span>
        <span>Period: {new Date(equity[0]?.ts).toLocaleDateString()} - {new Date(equity[equity.length - 1]?.ts).toLocaleDateString()}</span>
      </div>
    </div>
  );
} 