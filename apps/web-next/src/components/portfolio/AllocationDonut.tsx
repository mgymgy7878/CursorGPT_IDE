"use client";
import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { AssetRow } from "@/types/portfolio";

const C = ["#0ea5e9","#22c55e","#f59e0b","#ef4444","#8b5cf6","#14b8a6","#f472b6"];

export default function AllocationDonut({ rows }: { rows: AssetRow[] }) {
  const data = useMemo(() => {
    const arr = (rows || [])
      .map((r) => ({ name: r.asset, value: r.valueUsd ?? 0 }))
      .filter((d) => d.value > 0);
    const total = arr.reduce((s, x) => s + x.value, 0);
    return arr
      .sort((a,b)=>b.value-a.value)
      .slice(0, 7)
      .map((d) => ({ ...d, pct: total ? (d.value / total) * 100 : 0 }));
  }, [rows]);

  if (!data.length) {
    return (
      <div className="rounded-2xl border p-6 text-center">
        <div className="text-sm opacity-70">Dağılım verisi yok</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="px-2 pb-2 text-sm font-medium">Varlık Dağılımı</div>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie dataKey="value" data={data} innerRadius={60} outerRadius={80}>
              {data.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
            </Pie>
            <Tooltip formatter={(v:number)=>v.toLocaleString(undefined,{maximumFractionDigits:2})} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-1 text-xs">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background:C[i% C.length] }} />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto font-mono">{d.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
