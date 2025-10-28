"use client";
import { useEffect, useMemo, useState } from "react";
import type { BacktestRun, BacktestListResponse } from "@/types/backtest";

type F = "all" | "running" | "queued" | "done" | "failed";

export default function BacktestPage() {
  const [data, setData] = useState<BacktestListResponse | null>(null);
  const [filter, setFilter] = useState<F>("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<BacktestRun | null>(null);
  const [polling, setPolling] = useState(true);

  async function load() {
    const res = await fetch("/api/backtest/runs", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
    if (!polling) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [polling]);

  const runs = useMemo(() => {
    if (!data) return [];
    return data.runs.filter(r => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q && !(`${r.id} ${r.notes ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data, filter, q]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Backtest Runs</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={polling} onChange={e=>setPolling(e.target.checked)} />
            <span>{polling ? "Auto-refresh 5s" : "Paused"}</span>
          </label>
          <button onClick={load} className="px-3 py-1.5 rounded bg-gray-900 text-white">Refresh</button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {["total","running","queued","done","failed"].map((k) => (
          <div key={k} className="rounded-2xl border p-4">
            <div className="text-xs uppercase text-gray-500">{k}</div>
            <div className="text-2xl font-semibold">{(data as any)?.stats?.[k] ?? 0}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          placeholder="Ara (id/notlar)…"
          className="w-full md:w-72 border rounded-xl px-3 py-2"
          value={q} onChange={e=>setQ(e.target.value)}
        />
        <select className="w-full md:w-48 border rounded-xl px-3 py-2" value={filter} onChange={e=>setFilter(e.target.value as F)}>
          {["all","running","queued","done","failed"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="text-sm text-gray-500 ml-auto">
          {(runs?.length ?? 0)} / {(data?.runs.length ?? 0)} gösteriliyor
        </div>
      </section>

      {/* Table */}
      <section className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              {["ID","Durum","AUC","Sharpe","MaxDD","Win%","Süre","Artefaktlar"].map(h=>(
                <th key={h} className="py-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map(r => {
              const dur = r.finishedAt ? Math.max(0, (new Date(r.finishedAt).getTime()-new Date(r.startedAt).getTime())/1000) : null;
              return (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <button className="underline" onClick={()=>setDetail(r)}>{r.id}</button>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs
                      ${r.status==="done"?"bg-emerald-100 text-emerald-700":
                        r.status==="running"?"bg-amber-100 text-amber-700":
                        r.status==="failed"?"bg-rose-100 text-rose-700":"bg-gray-100 text-gray-700"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{r.metrics.auc?.toFixed(2) ?? "—"}</td>
                  <td className="py-2 pr-4">{r.metrics.sharpe?.toFixed(2) ?? "—"}</td>
                  <td className="py-2 pr-4">{r.metrics.maxDrawdown?.toFixed(2) ?? "—"}</td>
                  <td className="py-2 pr-4">{r.metrics.winRate!=null ? `${Math.round(r.metrics.winRate*100)}%`:"—"}</td>
                  <td className="py-2 pr-4">{dur!=null ? `${Math.round(dur/60)} dk` : "…"}</td>
                  <td className="py-2 pr-4">
                    {r.artifacts?.equityCsv && <a className="underline mr-2" href={r.artifacts.equityCsv}>Equity</a>}
                    {r.artifacts?.tradesCsv && <a className="underline mr-2" href={r.artifacts.tradesCsv}>Trades</a>}
                    {r.artifacts?.reportPdf && <a className="underline" href={r.artifacts.reportPdf} target="_blank">PDF</a>}
                  </td>
                </tr>
              );
            })}
            {!runs.length && (
              <tr><td colSpan={8} className="py-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Drawer (very simple) */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex" onClick={()=>setDetail(null)}>
          <div className="ml-auto h-full w-full max-w-xl bg-white p-6 overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Run: {detail.id}</h2>
              <button className="text-sm underline" onClick={()=>setDetail(null)}>Kapat</button>
            </div>
            <pre className="text-xs bg-gray-50 rounded p-3 overflow-x-auto">{JSON.stringify(detail, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

