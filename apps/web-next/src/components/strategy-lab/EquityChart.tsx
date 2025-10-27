// apps/web-next/src/components/strategy-lab/EquityChart.tsx
"use client";

import { useMemo } from "react";
import type { EquityPoint } from "@/types/backtest";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";

export default function EquityChart({
  data, height = 260, currency = false,
}: { data: EquityPoint[]; height?: number; currency?: boolean }) {
  const chart = useMemo(
    () =>
      data.map(d => ({ t: new Date(d.t), v: d.v })),
    [data]
  );

  return (
    <div className="w-full">
      <div className="text-sm mb-2 text-gray-600">Equity Curve</div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={chart} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              tickFormatter={(v) => new Date(v).toLocaleTimeString()}
              minTickGap={32}
            />
            <YAxis
              width={60}
              tickFormatter={(v) => currency ? formatCurrency(v) : v.toFixed(0)}
            />
            <Tooltip
              formatter={(value: any) => (currency ? formatCurrency(value as number) : (value as number).toFixed(2))}
              labelFormatter={(lbl) => new Date(lbl as any).toLocaleString()}
            />
            <ReferenceLine y={chart[0]?.v ?? 0} strokeOpacity={0.4} />
            <Line type="monotone" dataKey="v" strokeWidth={2} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatCurrency(v: number) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v); }
  catch { return `$${Math.round(v)}`; }
}
