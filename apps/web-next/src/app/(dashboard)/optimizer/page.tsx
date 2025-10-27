"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { getAuthToken, getAuthHeaders } from "@/lib/auth";

type State = "queued"|"running"|"done"|"failed"|"canceled";
type Job = { id:string; type:string; priority:number; state:State; createdAt:number; etaSec?:number|null; progress?:number; runtimeMs?:number; format?:string; };
type QueueResp = { updatedAt:number; rows:Job[]; stats:{running:number;queued:number;done:number;failed:number;total24h:number} };
type Metrics = { throughputPerMin:number; concurrency:number; rejectRate:number; queueDepth:number; trend:Array<{t:number;throughput:number}> };

function cls(...s:(string|false|undefined)[]) { return s.filter(Boolean).join(" "); }
const stateColor: Record<State,string> = {
  queued:   "bg-amber-100 text-amber-800",
  running:  "bg-sky-100 text-sky-800",
  done:     "bg-emerald-100 text-emerald-700",
  failed:   "bg-rose-100 text-rose-700",
  canceled: "bg-gray-200 text-gray-700",
};

export default function OptimizerPage() {
  const [queue,setQueue] = useState<QueueResp|null>(null);
  const [metrics,setMetrics] = useState<Metrics|null>(null);
  const [loading,setLoading] = useState(true);
  const [filter,setFilter] = useState<{q:string; state:"all"|State; format:"all"|"csv"|"pdf"|"parquet"|"other"}>({ q:"", state:"all", format:"all" });
  const [isPaused,setIsPaused] = useState<boolean|null>(null);
  const [busy,setBusy] = useState(false);
  const [useSSE, setUseSSE] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isAuthenticated = !!getAuthToken();

  async function load() {
    try {
      const [q,m] = await Promise.all([
        fetch("/api/optimizer/queue", { cache:"no-store" }).then(r=>r.json()),
        fetch("/api/optimizer/metrics", { cache:"no-store" }).then(r=>r.json()),
      ]);
      setQueue(q); setMetrics(m);
    } finally { setLoading(false); }
  }
  
  // SSE connection
  useEffect(() => {
    if (!useSSE) {
      // Fallback to polling
      load();
      const id = setInterval(load, 5000);
      return () => clearInterval(id);
    }
    
    // SSE mode
    const eventSource = new EventSource('/api/optimizer/stream');
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setSseConnected(true);
      setLoading(false);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setQueue(data);
        setSseConnected(true);
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };
    
    eventSource.onerror = () => {
      setSseConnected(false);
      eventSource.close();
      // Fallback to polling after 5 seconds
      setTimeout(() => {
        setUseSSE(false);
      }, 5000);
    };
    
    // Load metrics separately (not streamed)
    load().then(() => {
      const metricsInterval = setInterval(async () => {
        try {
          const m = await fetch("/api/optimizer/metrics", { cache:"no-store" }).then(r=>r.json());
          setMetrics(m);
        } catch {}
      }, 5000);
      
      return () => clearInterval(metricsInterval);
    });
    
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [useSSE]);

  const filtered = useMemo(() => {
    const rows = queue?.rows ?? [];
    return rows.filter(j => {
      const okText = !filter.q || [j.id, j.type, j.format].join(" ").toLowerCase().includes(filter.q.toLowerCase());
      const okState = filter.state === "all" || j.state === filter.state;
      const okFmt = filter.format === "all" || (j.format ?? "other") === filter.format;
      return okText && okState && okFmt;
    });
  }, [queue, filter]);

  async function togglePause(pause:boolean) {
    setBusy(true);
    try {
      const r = await fetch("/api/optimizer/pause", { 
        method:"POST", 
        headers:{ "Content-Type":"application/json", ...getAuthHeaders() }, 
        body: JSON.stringify({ pause }) 
      });
      if (!r.ok) {
        if (r.status === 401) throw new Error("Yetki gerekli (ADMIN_TOKEN)");
        throw new Error("pause/resume failed");
      }
      setIsPaused(pause);
    } catch (e:any) {
      alert(e?.message ?? "İşlem başarısız");
    } finally { setBusy(false); }
  }

  async function cancel(id:string) {
    if (!confirm(`Job iptal edilsin mi?\n${id}`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/optimizer/cancel/${encodeURIComponent(id)}`, { 
        method:"POST",
        headers: getAuthHeaders()
      });
      if (!r.ok) {
        if (r.status === 401) throw new Error("Yetki gerekli (ADMIN_TOKEN)");
        throw new Error("cancel failed");
      }
      // soft refresh
      load();
    } catch (e:any) {
      alert(e?.message ?? "İşlem başarısız");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Optimizer Queue</h1>
          <p className="text-sm text-gray-600">Gerçek zamanlı kuyruk görünümü ve kontrol paneli.</p>
          <p className="text-xs text-gray-500 mt-1">Son güncelleme: {queue?.updatedAt ? new Date(queue.updatedAt).toLocaleString() : (loading ? "yükleniyor..." : "—")}</p>
        </div>
        <div className="flex items-center gap-2">
          {sseConnected && <span className="text-xs text-green-600 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
            SSE Live
          </span>}
          {!useSSE && <span className="text-xs text-amber-600">Polling (5s)</span>}
          <button
            onClick={()=>togglePause(true)}
            disabled={!isAuthenticated || busy || isPaused === true}
            className={cls("px-3 py-2 rounded text-sm font-medium", (!isAuthenticated || busy||isPaused===true)?"bg-gray-200 text-gray-600 cursor-not-allowed":"bg-amber-600 text-white hover:bg-amber-700")}
            title={!isAuthenticated ? "Yetki gerekli (ADMIN_TOKEN)" : ""}
          >Pause</button>
          <button
            onClick={()=>togglePause(false)}
            disabled={!isAuthenticated || busy || isPaused === false}
            className={cls("px-3 py-2 rounded text-sm font-medium", (!isAuthenticated || busy||isPaused===false)?"bg-gray-200 text-gray-600 cursor-not-allowed":"bg-emerald-600 text-white hover:bg-emerald-700")}
            title={!isAuthenticated ? "Yetki gerekli (ADMIN_TOKEN)" : ""}
          >Resume</button>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card title="Running"   value={queue?.stats.running ?? 0} />
        <Card title="Queued"    value={queue?.stats.queued ?? 0} />
        <Card title="Done"      value={queue?.stats.done ?? 0} />
        <Card title="Failed"    value={queue?.stats.failed ?? 0} />
        <Card title="Throughput/min" value={metrics?.throughputPerMin?.toFixed(1) ?? "—"} />
        <Card title="Concurrency"    value={metrics?.concurrency ?? "—"} />
      </div>

      {/* Trend sparkline */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="font-medium mb-2">Throughput (son 24 dk)</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={(metrics?.trend ?? []).map(p=>({ x:new Date(p.t).toLocaleTimeString(), y:p.throughput }))}>
              <XAxis dataKey="x" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="y" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Queue Depth: <b>{metrics?.queueDepth ?? "—"}</b> · Reject Rate: <b>{metrics ? (metrics.rejectRate*100).toFixed(2) : "—"}%</b>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Ara (ID / tip / format)"
          value={filter.q}
          onChange={e=>setFilter(s=>({ ...s, q:e.target.value }))}
        />
        <select className="border rounded px-3 py-2 text-sm" value={filter.state} onChange={e=>setFilter(s=>({ ...s, state:e.target.value as any }))}>
          <option value="all">Tüm durumlar</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="done">Done</option>
          <option value="failed">Failed</option>
          <option value="canceled">Canceled</option>
        </select>
        <select className="border rounded px-3 py-2 text-sm" value={filter.format} onChange={e=>setFilter(s=>({ ...s, format:e.target.value as any }))}>
          <option value="all">Tüm formatlar</option>
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="parquet">Parquet</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>ID</Th><Th>Tip</Th><Th>Format</Th><Th>Öncelik</Th><Th>Durum</Th><Th>İlerleme</Th><Th>Yaş</Th><Th>ETA</Th><Th className="text-right pr-4">İşlem</Th>
            </tr>
          </thead>
          <tbody>
            {(filtered.length ? filtered : []).map(j => {
              const ageSec = Math.max(0, Math.floor((Date.now()-j.createdAt)/1000));
              const eta    = j.etaSec ?? null;
              return (
                <tr key={j.id} className="border-t">
                  <Td mono>{j.id}</Td>
                  <Td>{j.type}</Td>
                  <Td>{j.format ?? "—"}</Td>
                  <Td>{j.priority}</Td>
                  <Td><span className={`px-2 py-0.5 rounded ${stateColor[j.state]}`}>{j.state}</span></Td>
                  <Td>
                    {j.state==="running" ? (
                      <div className="w-32 h-2 bg-gray-200 rounded">
                        <div className="h-2 bg-indigo-600 rounded" style={{ width: `${Math.min(100, Math.max(0, j.progress ?? 0))}%` }} />
                      </div>
                    ) : (j.progress ?? (j.state==="done" ? 100 : 0)) + "%"
                    }
                  </Td>
                  <Td mono>{ageSec}s</Td>
                  <Td mono>{eta!=null ? `${eta}s` : "—"}</Td>
                  <Td className="text-right pr-4">
                    <button
                      onClick={()=>cancel(j.id)}
                      disabled={!isAuthenticated || (j.state!=="queued" && j.state!=="running") || busy}
                      className={cls("px-3 py-1.5 rounded border text-xs",
                        isAuthenticated && (j.state==="queued"||j.state==="running") && !busy ? "border-rose-300 text-rose-700 hover:bg-rose-50" : "border-gray-200 text-gray-400 cursor-not-allowed")}
                      title={!isAuthenticated ? "Yetki gerekli" : ""}
                    >Cancel</button>
                  </Td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }:{ title:string; value: string|number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
function Th({ children, className="" }:{children:any; className?:string}) {
  return <th className={cls("text-left font-medium px-3 py-2", className)}>{children}</th>;
}
function Td({ children, mono=false, className="" }:{children:any; mono?:boolean; className?:string}) {
  return <td className={cls("px-3 py-2", mono && "font-mono text-xs", className)}>{children}</td>;
}

