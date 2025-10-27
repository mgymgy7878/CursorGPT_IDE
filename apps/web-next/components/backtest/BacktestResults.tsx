"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BacktestPoint } from "@/lib/api/executor";

type Props = {
  data: BacktestPoint[] | null | undefined;
};

export default function BacktestResults({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="text-sm opacity-70">Henüz sonuç yok.</div>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleTimeString()} />
          <YAxis />
          <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
          <Line type="monotone" dataKey="equity" dot={false} stroke="#60a5fa" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


