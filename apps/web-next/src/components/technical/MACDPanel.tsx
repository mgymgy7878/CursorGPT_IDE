"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export interface MACDPanelProps {
  macd: number[];
  signal: number[];
  hist: number[];
}

export default function MACDPanel({ macd, signal, hist }: MACDPanelProps) {
  const data = macd.map((m, i) => ({ i, macd: m, signal: signal[i], hist: hist[i] }));
  
  return (
    <div className="h-[160px] w-full mt-3 border border-neutral-800 rounded-lg p-2 bg-neutral-950/50">
      <div className="text-xs font-semibold mb-1 opacity-70">MACD</div>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="i" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
            labelStyle={{ color: '#999' }}
          />
          {/* @ts-ignore - ReferenceLine type issue with recharts */}
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="macd" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="signal" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

