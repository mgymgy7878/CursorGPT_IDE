"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export interface StochPanelProps {
  k: number[];
  d: number[];
}

export default function StochPanel({ k, d }: StochPanelProps) {
  const data = k.map((kv, i) => ({ i, k: kv, d: d[i] }));
  
  return (
    <div className="h-[160px] w-full mt-3 border border-neutral-800 rounded-lg p-2 bg-neutral-950/50">
      <div className="text-xs font-semibold mb-1 opacity-70">Stochastic</div>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="i" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
            labelStyle={{ color: '#999' }}
          />
          <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" />
          <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="k" stroke="#a855f7" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="d" stroke="#ec4899" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

