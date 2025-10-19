"use client";
import { useMemo } from "react";

type Props = {
  equity: number[];
  title?: string;
  individual?: Array<{
    symbol: string;
    data: Array<{
      timestamp: number;
      value: number;
    }>;
  }>;
  showIndividual?: boolean;
};

export default function EquityCurveChart({ equity, title = "Equity Curve", individual, showIndividual = false }: Props) {
  const stats = useMemo(() => {
    if (!equity || equity.length === 0) return null;
    
    const start = equity[0];
    const end = equity[equity.length - 1];
    const pnl = end - start;
    const pnlPct = ((end / start - 1) * 100).toFixed(2);
    
    const max = Math.max(...equity);
    const maxIdx = equity.indexOf(max);
    
    let maxDrawdown = 0;
    for (let i = 0; i < equity.length; i++) {
      const peak = Math.max(...equity.slice(0, i + 1));
      const dd = (equity[i] - peak) / peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }
    
    return {
      start,
      end,
      pnl,
      pnlPct,
      max,
      maxIdx,
      maxDrawdown: (maxDrawdown * 100).toFixed(2),
    };
  }, [equity]);

  if (!equity || equity.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
        <h3 className="text-sm font-semibold mb-3">📈 {title}</h3>
        <div className="text-center py-8 text-neutral-500 text-sm">
          Backtest çıktısı bekleniyor...
        </div>
      </div>
    );
  }

  const minVal = Math.min(...equity);
  const maxVal = Math.max(...equity);
  const range = maxVal - minVal;
  const width = 100;
  const height = 60;
  
  const points = equity.map((val, idx) => {
    const x = (idx / (equity.length - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <h3 className="text-sm font-semibold mb-3">📈 {title}</h3>
      
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-32 mb-4"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke={stats && stats.pnl >= 0 ? "#10b981" : "#ef4444"}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {stats && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-neutral-500">Başlangıç</div>
            <div className="font-mono">${stats.start.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-neutral-500">Bitiş</div>
            <div className="font-mono">${stats.end.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-neutral-500">PnL</div>
            <div className={`font-mono ${stats.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.pnl >= 0 ? "+" : ""}{stats.pnl.toFixed(2)} ({stats.pnlPct}%)
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Max Drawdown</div>
            <div className="font-mono text-orange-400">{stats.maxDrawdown}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
