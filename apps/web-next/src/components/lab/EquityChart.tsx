"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  series: Array<{ t: number; eq: number }>;
  title?: string;
};

export default function EquityChart({ series, title = "Equity Curve" }: Props) {
  // Filter out NaN, Infinity, null, undefined
  const validSeries = (series || []).filter(
    (point) => 
      point && 
      typeof point.t === "number" && 
      typeof point.eq === "number" &&
      isFinite(point.t) && 
      isFinite(point.eq)
  );

  if (!validSeries || validSeries.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
        <h3 className="text-sm font-semibold mb-3">📈 {title}</h3>
        <div className="text-center py-8 text-neutral-500 text-sm">
          {series && series.length > 0 
            ? "⚠️ Veri geçersiz (NaN/Infinity)" 
            : "Backtest çıktısı bekleniyor..."}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <h3 className="text-sm font-semibold mb-3">📈 {title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={validSeries}>
            <XAxis 
              dataKey="t" 
              hide 
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#171717",
                border: "1px solid #404040",
                borderRadius: "8px"
              }}
              labelFormatter={(value) => `Time: ${value}`}
              formatter={(value: any) => [`$${value.toFixed(2)}`, "Equity"]}
            />
            <Line 
              type="monotone" 
              dataKey="eq" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

