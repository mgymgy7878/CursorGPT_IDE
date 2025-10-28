"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";

export interface PriceChartProps {
  candles: Array<{ t: number; c: number }>;
  fibLevels?: Array<{ ratio: number; price: number }>;
  bbSeries?: Array<{ u: number; m: number; l: number }>;
}

export default function PriceChart({ candles, fibLevels, bbSeries }: PriceChartProps) {
  const data = candles.map((c, i) => ({
    t: new Date(c.t).toLocaleString(),
    close: c.c,
    u: bbSeries?.[i]?.u,
    m: bbSeries?.[i]?.m,
    l: bbSeries?.[i]?.l,
  }));

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="t" hide />
          <YAxis domain={['auto', 'auto']} stroke="#666" />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
            labelStyle={{ color: '#999' }}
          />
          <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
          {bbSeries && (
            <>
              <Line type="monotone" dataKey="u" stroke="#10b981" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="m" stroke="#3b82f6" dot={false} strokeWidth={1} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="l" stroke="#ef4444" dot={false} strokeWidth={1} />
            </>
          )}
          {fibLevels?.map(l => (
            <ReferenceLine
              key={l.ratio}
              y={l.price}
              label={{
                value: `${(l.ratio * 100).toFixed(1)}%`,
                position: 'right' as const,
                fill: '#fbbf24'
              }}
              stroke={l.ratio === 0.618 ? '#fbbf24' : '#666'}
              strokeDasharray="3 3"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

