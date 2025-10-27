import React, { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Bar, Line, Cell
} from "recharts";

type W = any;
function pickOOS(w: W) {
  const o = w?.oos ?? w?.outSample ?? w?.OOS ?? {};
  return Number(o.totalPnl ?? o.pnl ?? 0);
}

export default function WFChart({ result }: { result: any }) {
  const rows = useMemo(() => {
    const ws: W[] = Array.isArray(result?.windows) ? result.windows : [];
    const out = ws.map((w, i) => ({ idx: (w.idx ?? i) + 1, pnl: pickOOS(w) }));
    let cum = 0;
    return out.map(r => ({ label: String(r.idx), oosPnL: r.pnl, cum: (cum += r.pnl) }));
  }, [result]);

  if (!rows.length) return <div className="panel" style={{ padding:12, opacity:.6 }}>WF sonucu yok.</div>;

  return (
    <div className="panel" style={{ padding: 8 }}>
      <div style={{ opacity:.7, marginBottom:8 }}>Walk‑Forward OOS (bar) + Kümülatif (çizgi)</div>
      <div style={{ width:'100%', height:280 }}>
        <ResponsiveContainer>
          <ComposedChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" />
            <Tooltip />
            <Bar dataKey="oosPnL" yAxisId="left">
              {rows.map((r,i) => <Cell key={i} fill={r.oosPnL >= 0 ? '#10b981' : '#ef4444'} />)}
            </Bar>
            <Line dataKey="cum" yAxisId="left" dot={false} stroke="#111827" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
