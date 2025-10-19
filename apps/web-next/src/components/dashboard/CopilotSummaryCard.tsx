"use client";
import { useEffect, useState } from "react";
import Sparkline from "@/components/common/Sparkline";

type Summary = {
  ts: number;
  counts: { strategies: number; amber: number; red: number; openOrders: number; alertsActive: number };
};

export default function CopilotSummaryCard({ intervalMs = 30000 }: { intervalMs?: number }) {
  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hist, setHist] = useState<{ ts:number; strategies:number; openOrders:number }[]>([]);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/copro/summary", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as Summary;
      setSum(j);
      const c: any = (j as any)?.counts ?? {};
      setHist(h => [...h, { ts: j.ts, strategies: Number(c.strategies||0), openOrders: Number(c.openOrders||0) }].slice(-40));
    } catch (e:any) {
      setErr(e?.message ?? "Özet alınamadı");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Copilot Özet</h2>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={load} disabled={loading}>{loading ? "…" : "Yenile"}</button>
          <span className="muted text-xs">
            {sum ? new Date(sum.ts).toLocaleTimeString() : (err ? "Hata" : "—")}
          </span>
        </div>
      </div>
      {err && <div className="muted mt-2">Hata: {err}</div>}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
        <Stat label="Strateji" value={sum?.counts.strategies ?? 0} />
        <Stat label="Amber" value={sum?.counts.amber ?? 0} />
        <Stat label="Red" value={sum?.counts.red ?? 0} />
        <Stat label="Açık Emir" value={sum?.counts.openOrders ?? 0} />
        <Stat label="Aktif Uyarı" value={sum?.counts.alertsActive ?? 0} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card p-3">
          <div className="muted text-xs mb-1">Stratejiler (trend)</div>
          <Sparkline data={hist.map(x=>x.strategies)} title="Strategies trend" />
        </div>
        <div className="card p-3">
          <div className="muted text-xs mb-1">Açık Emirler (trend)</div>
          <Sparkline data={hist.map(x=>x.openOrders)} title="Open orders trend" />
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value }:{label:string; value:number}) {
  return (
    <div className="card-sub p-3">
      <div className="muted text-xs">{label}</div>
      <div className="text-2xl font-semibold">{Number(value)}</div>
    </div>
  );
}


