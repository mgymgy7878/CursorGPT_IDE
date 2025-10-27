"use client";

import { useEffect, useState } from "react";

type Position = {
  symbol: string;
  positionAmt?: number | string;
  entryPrice?: number | string;
  unrealizedProfit?: number | string;
};

export default function MiniPositions() {
  const [data, setData] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/futures/positions")
      .then(r => r.json())
      .then(j => { if (mounted) setData(Array.isArray(j) ? j : (j?.positions ?? [])); })
      .catch(() => { if (mounted) setData([]); })
      .finally(() => { if (mounted) setLoading(false); });
    const id = setInterval(() => {
      fetch("/api/futures/positions").then(r=>r.json()).then(j=> setData(Array.isArray(j) ? j : (j?.positions ?? []))).catch(()=>{})
    }, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="p-3 rounded-lg border border-gray-700 bg-gray-900">
      <div className="text-sm font-semibold mb-2">Mini Pozisyonlar</div>
      {loading && <div className="text-xs text-gray-400">Yükleniyor…</div>}
      <div className="space-y-2 max-h-64 overflow-auto">
        {data.map((p, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 text-xs items-center">
            <div className="font-mono text-gray-200">{p.symbol}</div>
            <div className="text-gray-300">{String(p.positionAmt ?? "—")}</div>
            <div className="text-gray-300">{String(p.entryPrice ?? "—")}</div>
            <div className={`font-semibold ${Number(p.unrealizedProfit) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {String(p.unrealizedProfit ?? "—")}
            </div>
          </div>
        ))}
        {!data.length && !loading && (
          <div className="text-xs text-gray-500">Pozisyon yok</div>
        )}
      </div>
    </div>
  );
}


