"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeepalive } from "@/lib/useKeepalive";

type UdsInfo = { listenKey?: string; lastKeepaliveTs?: number };
type LifecycleEvent = { ts: number; type: string; info?: any };

export default function FuturesOps() {
  useKeepalive("/api/futures/time", 30_000);
  const base = "/api/futures";
  const [uds, setUds] = useState<UdsInfo>({});
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [ping, setPing] = useState<number | undefined>();

  const pushEvent = useCallback((evt: LifecycleEvent) => {
    setEvents(prev => [evt, ...prev].slice(0, 10));
  }, []);

  async function request(path: string, init?: RequestInit) {
    const t0 = performance.now();
    const r = await fetch(`${base}${path}`, init);
    const dt = performance.now() - t0;
    setPing(Math.round(dt));
    let j: any = {};
    try { j = await r.json(); } catch { /* ignore */ }
    return { r, j } as const;
  }

  const create = useCallback(async () => {
    const { j } = await request("/userDataStream", { method: "POST" });
    setUds({ listenKey: j.listenKey, lastKeepaliveTs: Date.now() });
    pushEvent({ ts: Date.now(), type: "create", info: j });
  }, [pushEvent]);

  const keepalive = useCallback(async () => {
    const key = uds.listenKey;
    if (!key) return;
    const { j } = await request(`/userDataStream?listenKey=${encodeURIComponent(key)}`, { method: "PUT" });
    setUds(prev => ({ ...prev, lastKeepaliveTs: Date.now() }));
    pushEvent({ ts: Date.now(), type: "keepalive", info: j });
  }, [uds.listenKey, pushEvent]);

  const close = useCallback(async () => {
    const key = uds.listenKey;
    if (!key) return;
    const { j } = await request(`/userDataStream?listenKey=${encodeURIComponent(key)}`, { method: "DELETE" });
    setUds({});
    pushEvent({ ts: Date.now(), type: "close", info: j });
  }, [uds.listenKey, pushEvent]);

  useEffect(() => {
    // initial time check for visibility
    request("/time", { method: "GET" }).catch(() => { /* ignore */ });
  }, []);

  const lastKeepaliveAgo = useMemo(() => {
    if (!uds.lastKeepaliveTs) return "—";
    const diff = Math.floor((Date.now() - uds.lastKeepaliveTs) / 1000);
    return `${diff}s`;
  }, [uds.lastKeepaliveTs]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Futures İşlemleri</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-gray-700 bg-gray-900">
          <div className="text-sm text-gray-400 mb-2">Yaşam Döngüsü</div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={create}>Oluştur</button>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={keepalive}>Canlı Tut</button>
            <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={close}>Kapat</button>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-700 bg-gray-900">
          <div className="text-sm text-gray-400 mb-2">UDS Durum</div>
          <div className="text-sm">ListenKey: <span className="font-mono">{uds.listenKey ?? "—"}</span></div>
          <div className="text-sm">Son Keepalive: {lastKeepaliveAgo}</div>
          <div className="mt-2 inline-flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${uds.listenKey ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-600/30 text-gray-300"}`}>
              WS Durumu: {uds.listenKey ? "AKTİF" : "PASİF"}
            </span>
            <span className="px-2 py-1 rounded-full bg-gray-600/30 text-gray-300">Gecikme: {ping ?? "—"} ms</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-700 bg-gray-900">
          <div className="text-sm text-gray-400 mb-2">Son 10 Olay</div>
          <ul className="text-xs space-y-1 max-h-40 overflow-auto">
            {events.map((e, i) => (
              <li key={i} className="font-mono text-gray-300">
                {new Date(e.ts).toLocaleTimeString()} - {e.type}
              </li>
            ))}
            {!events.length && <li className="text-gray-500">(Olay yok)</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}


