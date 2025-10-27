"use client";
import { useEffect, useMemo, useState } from "react";
import type { BacktestRun, BacktestListResponse } from "@/types/backtest";
import { getMetric } from "@/lib/safeMetric";
import { pickString } from "@/lib/safe";

type F = "all" | "running" | "queued" | "done" | "failed";

export default function BacktestPage() {
  const [data, setData] = useState<BacktestListResponse | null>(null);
  const [filter, setFilter] = useState<F>("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<BacktestRun | null>(null);
  const [useSse, setUseSse] = useState(true);
  const [sseStatus, setSseStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("disconnected");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newRun, setNewRun] = useState({ pair: "BTCUSDT", timeframe: "1h", notes: "", params: "{}" });
  const [toast, setToast] = useState<{msg: string; type: "success"|"error"} | null>(null);
  
  const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";

  async function load() {
    const res = await fetch("/api/backtest/runs", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    if (!useSse) {
      // Fallback to polling
      load();
      const id = setInterval(load, 5000);
      return () => clearInterval(id);
    }

    // SSE connection
    setSseStatus("connecting");
    const es = new EventSource("/api/backtest/stream");
    let reconnectTimeout: NodeJS.Timeout;

    es.addEventListener("snapshot", (e) => {
      try {
        const snapshot = JSON.parse(e.data);
        setData(snapshot);
        setSseStatus("connected");
      } catch (err) {
        console.error("[SSE] Failed to parse snapshot:", err);
      }
    });

    es.addEventListener("update", (e) => {
      try {
        const update = JSON.parse(e.data);
        setData(update);
      } catch (err) {
        console.error("[SSE] Failed to parse update:", err);
      }
    });

    es.onerror = () => {
      setSseStatus("error");
      es.close();
      
      // Exponential backoff retry (start with 2s, max 30s)
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        if (useSse) setSseStatus("connecting");
      }, 2000);
    };

    return () => {
      es.close();
      clearTimeout(reconnectTimeout);
      setSseStatus("disconnected");
    };
  }, [useSse]);

  const runs = useMemo(() => {
    if (!data) return [];
    return data.runs.filter(r => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q && !(`${r.id} ${r.notes ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data, filter, q]);

  async function handleStartBacktest() {
    const token = localStorage.getItem("admin-token") || "";
    try {
      const params = JSON.parse(newRun.params);
      const res = await fetch("/api/backtest/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          pair: newRun.pair,
          timeframe: newRun.timeframe,
          notes: newRun.notes,
          params,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: `Backtest ${data.id} başlatıldı`, type: "success" });
        setShowNewModal(false);
        setNewRun({ pair: "BTCUSDT", timeframe: "1h", notes: "", params: "{}" });
      } else {
        setToast({ msg: data.error || "Başlatma başarısız", type: "error" });
      }
    } catch (err: any) {
      setToast({ msg: err.message, type: "error" });
    }
    setTimeout(() => setToast(null), 5000);
  }

  async function handleCancelRun(id: string) {
    if (!confirm(`${id} iptal edilsin mi?`)) return;
    const token = localStorage.getItem("admin-token") || "";
    try {
      const res = await fetch(`/api/backtest/cancel/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: `${id} iptal edildi`, type: "success" });
      } else {
        setToast({ msg: data.error || "İptal başarısız", type: "error" });
      }
    } catch (err: any) {
      setToast({ msg: err.message, type: "error" });
    }
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Backtest Runs</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={useSse} onChange={e=>setUseSse(e.target.checked)} />
            <span>Live (SSE)</span>
          </label>
          {useSse && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              sseStatus === "connected" ? "bg-green-100 text-green-700" :
              sseStatus === "connecting" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {sseStatus === "connected" ? "●" : 
               sseStatus === "connecting" ? "⟳" : "✕"} {sseStatus}
            </span>
          )}
          {!useSse && <button onClick={load} className="px-3 py-1.5 rounded bg-gray-900 text-white">Refresh</button>}
          <button 
            onClick={() => setShowNewModal(true)}
            disabled={!adminEnabled}
            title={!adminEnabled ? "Yalnızca admin" : ""}
            className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Yeni Backtest
          </button>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded shadow-lg ${
          toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {["total","running","queued","done","failed"].map((k) => (
          <div key={k} className="rounded-2xl border p-4">
            <div className="text-xs uppercase text-gray-500">{k}</div>
            <div className="text-2xl font-semibold">{(data as any)?.stats?.[k] ?? 0}</div>
          </div>
        ))}
        <div className="rounded-2xl border p-4">
          <div className="text-xs uppercase text-gray-500">P95 Duration</div>
          <div className="text-2xl font-semibold">
            {data?.stats?.p95DurationSec != null 
              ? `${Math.round(data.stats.p95DurationSec)}s` 
              : "—"}
          </div>
        </div>
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
              {["ID","Durum","AUC","Sharpe","MaxDD","Win%","Süre","Artefaktlar","İşlem"].map(h=>(
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
                  <td className="py-2 pr-4">{(()=>{ const v=getMetric(r.metrics, "auc"); return v!=null? v.toFixed(2):"—";})()}</td>
                  <td className="py-2 pr-4">{(()=>{ const v=getMetric(r.metrics, "sharpe"); return v!=null? v.toFixed(2):"—";})()}</td>
                  <td className="py-2 pr-4">{(()=>{ const v=getMetric(r.metrics, "maxDrawdown"); return v!=null? v.toFixed(2):"—";})()}</td>
                  <td className="py-2 pr-4">{(()=>{ const v=getMetric(r.metrics, "winRate"); return v!=null? `${Math.round(v*100)}%`:"—";})()}</td>
                  <td className="py-2 pr-4">{dur!=null ? `${Math.round(dur/60)} dk` : "…"}</td>
                  <td className="py-2 pr-4">
                    {(() => { const u = pickString(r.artifacts, "equityCsv"); return u ? <a className="underline mr-2" href={u}>Equity</a> : <span className="text-gray-400">—</span>; })()}
                    {(() => { const u = pickString(r.artifacts, "tradesCsv"); return u ? <a className="underline mr-2" href={u}>Trades</a> : <span className="text-gray-400">—</span>; })()}
                    {(() => { const u = pickString(r.artifacts, "reportPdf"); return u ? <a className="underline" href={u} target="_blank" rel="noreferrer">PDF</a> : <span className="text-gray-400">—</span>; })()}
                  </td>
                  <td className="py-2 pr-4">
                    {(r.status === "running" || r.status === "queued") && (
                      <button
                        onClick={() => handleCancelRun(String(r.id))}
                        disabled={!adminEnabled}
                        title={!adminEnabled ? "Yalnızca admin" : "İptal et"}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        İptal
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!runs.length && (
              <tr><td colSpan={9} className="py-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* New Backtest Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center" onClick={() => setShowNewModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Yeni Backtest</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Pair</label>
                <input 
                  className="w-full border rounded px-3 py-2" 
                  value={newRun.pair} 
                  onChange={e => setNewRun({...newRun, pair: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeframe</label>
                <input 
                  className="w-full border rounded px-3 py-2" 
                  value={newRun.timeframe} 
                  onChange={e => setNewRun({...newRun, timeframe: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notlar</label>
                <input 
                  className="w-full border rounded px-3 py-2" 
                  value={newRun.notes} 
                  onChange={e => setNewRun({...newRun, notes: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Params (JSON)</label>
                <textarea 
                  className="w-full border rounded px-3 py-2 font-mono text-sm" 
                  rows={4}
                  value={newRun.params} 
                  onChange={e => setNewRun({...newRun, params: e.target.value})}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  İptal
                </button>
                <button 
                  onClick={handleStartBacktest}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  Başlat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer (very simple) */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex" onClick={()=>setDetail(null)}>
          <div className="ml-auto h-full w-full max-w-xl bg-white p-6 overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Run: {detail.id}</h2>
              <button className="text-sm underline" onClick={()=>setDetail(null)}>Kapat</button>
            </div>
            
            {/* Equity Sparkline (if available) */}
            {detail.equity && detail.equity.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-xs font-medium text-gray-600 mb-2">Equity Curve</div>
                <svg width="100%" height="60" className="overflow-visible">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points={detail.equity.map((pt, i) => {
                      const x = (i / (detail.equity!.length - 1)) * 100;
                      const vals = detail.equity!.map(p => p[1]);
                      const min = Math.min(...vals);
                      const max = Math.max(...vals);
                      const range = max - min || 1;
                      const y = 60 - ((pt[1] - min) / range) * 50;
                      return `${x}%,${y}`;
                    }).join(" ")}
                  />
                </svg>
                <div className="text-xs text-gray-500 mt-1">
                  Start: {detail.equity[0][1].toFixed(2)} → End: {detail.equity[detail.equity.length-1][1].toFixed(2)}
                </div>
              </div>
            )}
            
            <pre className="text-xs bg-gray-50 rounded p-3 overflow-x-auto">{JSON.stringify(detail, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

