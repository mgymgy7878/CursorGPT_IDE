"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

type Point = { t: string | number; v: number };

export default function TechnicalOverview({ data }: { data?: Point[] }){
  const series = data ?? Array.from({ length: 32 }, (_, i) => ({ t: i, v: 100 + Math.sin(i/3) * 5 + (i%5) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <XAxis dataKey="t" hide />
          <YAxis domain={["auto","auto"]} hide />
          <Tooltip />
          <Line type="monotone" dataKey="v" stroke="#63a9ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

