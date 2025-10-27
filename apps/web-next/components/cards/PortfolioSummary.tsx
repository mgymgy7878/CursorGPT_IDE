'use client';

import { useEffect, useState } from "react";

type Portfolio = {
  source: 'executor' | 'evidence';
  totals: {
    notional: number;
    realized: number;
    unrealized: number;
    exposure: number;
    leverage: number;
  };
  positions: Array<{
    symbol: string;
    notional: number;
    qty: number;
    uPnl: number;
    side: string;
  }>;
};

export default function PortfolioSummary() {
  const [data, setData] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/api/public/portfolio/summary', { cache: 'no-store' });
        const j = await r.json();
        if (alive) setData(j);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 10000); // 10s refresh
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (loading) return <div className="animate-pulse text-zinc-400">Yükleniyor…</div>;
  if (!data) return <div className="text-red-400">Portfolio verisi alınamadı</div>;

  const ok = data.source === 'executor';

  return (
    <div className="space-y-3">
      <div className="chips">
        <span className={`chip ${ok ? 'ok' : 'warn'}`}>{ok ? 'HEALTHY' : 'DEGRADED'}</span>
        <span className="chip">{`src:${data.source}`}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="subtle">Total Notional</span>
          <div className="font-semibold">${data.totals.notional.toLocaleString()}</div>
        </div>
        <div>
          <span className="subtle">Realized P&L</span>
          <div className={`font-semibold ${data.totals.realized >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${data.totals.realized.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="subtle">Unrealized P&L</span>
          <div className={`font-semibold ${data.totals.unrealized >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${data.totals.unrealized.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="subtle">Exposure</span>
          <div className="font-semibold">${data.totals.exposure.toLocaleString()}</div>
        </div>
      </div>

      {data.positions.length > 0 && (
        <div className="text-xs">
          <div className="subtle mb-1">Positions ({data.positions.length})</div>
          <div className="space-y-1">
            {data.positions.slice(0, 3).map((pos, i) => (
              <div key={i} className="flex justify-between">
                <span>{pos.symbol}</span>
                <span className={pos.uPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                  ${pos.uPnl.toFixed(2)}
                </span>
              </div>
            ))}
            {data.positions.length > 3 && (
              <div className="text-zinc-500">+{data.positions.length - 3} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 