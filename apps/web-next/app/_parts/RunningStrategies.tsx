"use client";
import { useEffect, useState } from "react";
import { getRunningStrategies, strategyStartDry, strategyStartLive, strategyStop } from "./api";

type Row = {
  id: string;
  symbol: string;
  tf: string;
  status: "running" | "paused" | "error" | "idle";
  rr?: number;
  pnl?: number;
};

export default function RunningStrategies() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const data = await getRunningStrategies();
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  async function doStartDry(r: Row) {
    setBusy(r.id); try {
      const res = await strategyStartDry(r);
      if (!res.ok) alert("Dry-run başlatılamadı.");
    } finally { setBusy(null); }
  }
  async function doStartLive(r: Row) {
    if (!confirm("Canlı başlatılacak ve onay gerekecek. Devam edilsin mi?")) return;
    setBusy(r.id); try {
      const res = await strategyStartLive(r);
      if (!res.ok) alert("Canlı başlatma isteği gönderilemedi.");
    } finally { setBusy(null); }
  }
  async function doStop(r: Row) {
    if (!confirm("Strateji durdurulsun mu? (onay gerekecek)")) return;
    setBusy(r.id); try {
      const res = await strategyStop(r);
      if (!res.ok) alert("Durdurma isteği gönderilemedi.");
    } finally { setBusy(null); }
  }

  if (!rows.length) return <div className="text-sm opacity-70">Çalışan strateji bulunamadı.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100/70 dark:bg-white/5">
          <tr>
            <th className="text-left p-3">ID</th>
            <th className="text-left p-3">Sembol</th>
            <th className="text-left p-3">TF</th>
            <th className="text-left p-3">Durum</th>
            <th className="text-right p-3">RR</th>
            <th className="text-right p-3">PnL</th>
            <th className="text-right p-3">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-black/5 dark:border-white/10">
              <td className="p-3">{r.id}</td>
              <td className="p-3">{r.symbol}</td>
              <td className="p-3">{r.tf}</td>
              <td className="p-3">{r.status}</td>
              <td className="p-3 text-right">{r.rr?.toFixed?.(2) ?? "-"}</td>
              <td className="p-3 text-right">{typeof r.pnl === "number" ? r.pnl.toFixed(2) : "-"}</td>
              <td className="p-3 text-right space-x-2">
                <button onClick={()=>doStartDry(r)} disabled={busy===r.id}
                  className="rounded-md border px-2 py-1 hover:bg-emerald-50">Başlat (dry)</button>
                <button onClick={()=>doStartLive(r)} disabled={busy===r.id}
                  className="rounded-md border px-2 py-1 text-amber-700 border-amber-300 hover:bg-amber-50">Başlat (live)</button>
                <button onClick={()=>doStop(r)} disabled={busy===r.id}
                  className="rounded-md border px-2 py-1 text-red-700 border-red-300 hover:bg-red-50">Durdur</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}