import React, { useMemo } from "react";

type W = any; // WF window tipiniz değişken olabilir (mapper toleranslı)

function pickOOS(w: W) {
  const o = w?.oos ?? w?.outSample ?? w?.OOS ?? {};
  return {
    pnl: Number(o.totalPnl ?? o.pnl ?? 0),
    dd: Number(o.maxDrawdown ?? o.maxDD ?? 0),
    wr: Number(o.winRate ?? o.WR ?? 0),
    sharpe: (o.sharpe ?? null) as number | null
  };
}

export default function WFSummaryCards({ result }: { result: any }) {
  const stat = useMemo(() => {
    const windows: W[] = Array.isArray(result?.windows) ? result.windows : [];
    const arr = windows.map(pickOOS);
    const n = arr.length || 1;
    const sum = (k: keyof typeof arr[0]) => arr.reduce((a, b) => a + (Number(b[k] ?? 0) || 0), 0);
    const avg = (v: number) => v / n;
    const pos = arr.filter(x => (x.pnl ?? 0) > 0).length;

    return {
      windows: n,
      oosAvgPnl: avg(sum('pnl')),
      oosPosRate: n ? (pos / n) : 0,
      oosAvgDD: avg(sum('dd')),
      oosAvgWR: avg(sum('wr')),
      oosAvgSharpe: (() => {
        const xs = arr.map(x => x.sharpe).filter(x => x != null) as number[];
        return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
      })()
    };
  }, [result]);

  const fmt = (n: number | null | undefined, d = 2) =>
    n == null || Number.isNaN(n) ? '—' : (n as any).toFixed ? (n as any).toFixed(d) : String(n);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(140px, 1fr))', gap:10 }}>
      <div className="kpi"><div>Pencere</div><strong>{stat.windows}</strong></div>
      <div className="kpi"><div>OOS Ort. PnL</div><strong>{fmt(stat.oosAvgPnl)}</strong></div>
      <div className="kpi"><div>OOS Pozitif Oran</div><strong>{(stat.oosPosRate*100).toFixed(1)}%</strong></div>
      <div className="kpi"><div>OOS Ort. DD</div><strong>{fmt(stat.oosAvgDD)}%</strong></div>
      <div className="kpi"><div>OOS Ort. WR</div><strong>{(stat.oosAvgWR*100).toFixed(1)}%</strong></div>
      <style jsx global>{`
        .kpi { background:#fff; border:1px solid rgba(0,0,0,.06); border-radius:10px; padding:10px }
        .kpi > div { font-size:12px; color:#6b7280; }
        .kpi > strong { font-size:16px; }
      `}</style>
    </div>
  );
} 
