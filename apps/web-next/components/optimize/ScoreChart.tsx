"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line as any), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis as any), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis as any), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip as any), { ssr: false });

type Point = { t: number | string; score: number };

export default function ScoreChart() {
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {
    fetch("/api/optimize/score")
      .then(r => r.json())
      .then(j => setData(Array.isArray(j) ? j : (j?.series ?? [])))
      .catch(() => setData([]));
  }, []);

  return (
    <div className="p-3 rounded-lg border border-gray-700 bg-gray-900" style={{height:220}}>
      <div className="text-sm font-semibold mb-2">Skor Grafiği</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <XAxis dataKey="t" hide={false} tick={{ fill: '#9ca3af', fontSize: 10 }} {...({} as any)} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={["auto", "auto"]} {...({} as any)} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151' }} {...({} as any)} />
          <Line type="monotone" dataKey="score" stroke="#60a5fa" dot={false} strokeWidth={2} {...({} as any)} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


