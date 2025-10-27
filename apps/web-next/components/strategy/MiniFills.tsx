"use client";

import { useEffect, useState } from "react";

type Fill = {
  id?: string;
  symbol?: string;
  side?: string;
  price?: number | string;
  qty?: number | string;
  ts?: number;
};

export default function MiniFills() {
  const [fills, setFills] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/futures/fills")
      .then(r => r.json())
      .then(j => { if (mounted) setFills(Array.isArray(j) ? j.slice(-10).reverse() : (j?.fills ?? []).slice(-10).reverse()); })
      .catch(() => { if (mounted) setFills([]); })
      .finally(() => { if (mounted) setLoading(false); });
    const id = setInterval(() => {
      fetch("/api/futures/fills").then(r=>r.json()).then(j=> setFills(Array.isArray(j) ? j.slice(-10).reverse() : (j?.fills ?? []).slice(-10).reverse())).catch(()=>{})
    }, 6000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="p-3 rounded-lg border border-gray-700 bg-gray-900">
      <div className="text-sm font-semibold mb-2">Mini Fills</div>
      {loading && <div className="text-xs text-gray-400">Yükleniyor…</div>}
      <div className="space-y-2 max-h-64 overflow-auto">
        {fills.map((f, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 text-xs items-center">
            <div className="font-mono text-gray-200">{f.symbol ?? "—"}</div>
            <div className={`text-gray-300 ${f.side === 'BUY' ? 'text-emerald-300' : f.side === 'SELL' ? 'text-red-300' : ''}`}>{f.side ?? "—"}</div>
            <div className="text-gray-300">{String(f.price ?? "—")}</div>
            <div className="text-gray-300">{String(f.qty ?? "—")}</div>
            <div className="text-gray-400">{f.ts ? new Date(f.ts).toLocaleTimeString() : "—"}</div>
          </div>
        ))}
        {!fills.length && !loading && (
          <div className="text-xs text-gray-500">Fill bulunamadı</div>
        )}
      </div>
    </div>
  );
}


