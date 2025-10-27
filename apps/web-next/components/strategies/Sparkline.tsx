"use client";
import { Line, LineChart, ResponsiveContainer } from "recharts";

export default function Sparkline({ points }: { points: number[] }) {
  const data = points.map((y, i) => ({ i, y }));
  return (
    <div style={{ height: 80 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="y" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


