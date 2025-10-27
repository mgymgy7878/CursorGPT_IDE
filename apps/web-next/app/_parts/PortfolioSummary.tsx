"use client";
import { useEffect, useState } from "react";
import { getPnL, getPositions, portfolioCloseAll } from "./api";

type Position = { id: string; symbol: string; side: "LONG"|"SHORT"; qty: number; entry: number; pnl?: number };

export default function PortfolioSummary() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [pnl, setPnl] = useState<any>(null);
  const [closing, setClosing] = useState(false);

  async function refresh() {
    setPositions(await getPositions());
    setPnl(await getPnL());
  }
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  async function closeAll() {
    if (!confirm("Acil kapat isteği CANLI etkidir ve onay sürecine gider. Devam edilsin mi?")) return;
    setClosing(true);
    try {
      const r = await portfolioCloseAll();
      if (r.ok) alert("İstek gönderildi. Yönetici onayı beklenecek.");
      else alert("İstek gönderilemedi (executor yanıt vermedi).");
    } finally { setClosing(false); }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-black/5 dark:border-white/10 p-4">
        <div className="font-semibold mb-2">Açık Pozisyonlar</div>
        {!positions.length ? (
          <div className="text-sm opacity-70">Açık pozisyon yok.</div>
        ) : (
          <ul className="text-sm space-y-2">
            {positions.map(p => (
              <li key={p.id} className="flex justify-between">
                <span>{p.symbol} • {p.side} • {p.qty}</span>
                <span className="tabular-nums">{typeof p.pnl==="number" ? p.pnl.toFixed(2) : "-"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-black/5 dark:border-white/10 p-4">
        <div className="font-semibold mb-2">PnL Özeti</div>
        <pre className="text-xs whitespace-pre-wrap opacity-80">
          {pnl ? JSON.stringify(pnl, null, 2) : "PnL verisi yok / endpoint kapalı."}
        </pre>

        <button onClick={closeAll} disabled={closing}
          className="mt-4 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-red-50 border-red-300 text-red-700 disabled:opacity-60">
          {closing ? "İstek gönderiliyor…" : "Acil: Tüm Pozisyonları Kapat (Onaylı)"}
        </button>
      </div>
    </div>
  );
}