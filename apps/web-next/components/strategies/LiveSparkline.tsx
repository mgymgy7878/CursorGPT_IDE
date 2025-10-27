'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { useStrategyWS } from '@/lib/ws/useStrategyWS';

type Point = { i: number; y: number };
type Props = { id: string; url?: string; max?: number };
export default function LiveSparkline({ id, url = process.env.NEXT_PUBLIC_EXECUTOR_WS_URL as string, max = 90 }: Props) {
  const msg = useStrategyWS(url);
  const [series, setSeries] = useState<Point[]>([]);
  const iRef = useRef(0);

  useEffect(() => {
    if (!msg || msg.id !== id || document.hidden) return;
    iRef.current += 1;
    setSeries((s) => {
      const next = [...s, { i: iRef.current, y: msg.pl }];
      return next.length > max ? next.slice(-max) : next;
    });
  }, [msg, id, max, document.hidden]);

  const data = useMemo(() => series, [series]);

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


