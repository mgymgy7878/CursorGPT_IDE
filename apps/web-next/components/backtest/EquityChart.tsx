"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export default function EquityChart({data}:{data:{t:number; equity:number}[]}) {
  const rows = (data||[]).map(d=>({ ts:new Date(d.t).toLocaleString(), equity:d.equity }));
  return (
    <div className="p-3 rounded-2xl border bg-white shadow-sm">
      <div className="font-semibold mb-2">Equity Curve</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <XAxis dataKey="ts" hide />
            <YAxis domain={['auto','auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="equity" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 