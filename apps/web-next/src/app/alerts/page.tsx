"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const AlertsControl = dynamic(()=>import("@/components/alerts/AlertsControl"), { ssr:false });

type AlertItem = {
  id: string;
  symbol: string;
  timeframe: string;
  type: string;
  active: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
};

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { cache: "no-store", ...init });
  // Artık throw yok — SSR crash engellendi
  const j = await r.json().catch(() => ({ items: [], _err: "parse" }));
  return j as { items?: any[]; events?: any[]; _err?: string };
}

export default function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/alerts/list");
      setItems(data.items ?? []);
      // _err varsa console'da log'la ama sayfa çökmesin
      if (data._err) console.warn("Alerts API error:", data._err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function enable(id: string, on: boolean) {
    const data = await api(`/api/alerts/${on ? "enable" : "disable"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (data._err) console.warn("Enable/disable error:", data._err);
    await load();
  }

  async function del(id: string) {
    if (!confirm("Bu alert'i silmek istediğinizden emin misiniz?")) return;
    const data = await api("/api/alerts/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (data._err) console.warn("Delete error:", data._err);
    await load();
  }

  async function test(id: string) {
    const data = await api("/api/alerts/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (data._err) {
      alert(`❌ Test hatası: ${data._err}`);
    } else {
      alert("✅ Test isteği gönderildi (trigger varsa konsolda/kanalda görünecek)");
    }
  }

  async function showHistory(id: string) {
    const q = new URLSearchParams({ id, limit: "20" });
    const data = await api(`/api/alerts/history?${q.toString()}`);
    if (data._err) console.warn("History error:", data._err);
    setHistoryId(id);
    setHistory(data.events ?? []);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">🔔 Alerts</h1>
          <p className="text-sm opacity-70">Alert yönetimi ve geçmiş</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "⏳ Yenileniyor..." : "↻ Yenile"}
        </button>
      </div>

      <div className="overflow-x-auto border border-neutral-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-300 bg-neutral-900/50">
            <tr className="border-b border-neutral-800">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Symbol</th>
              <th className="py-3 px-4">TF</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Active</th>
              <th className="py-3 px-4">Last Triggered</th>
              <th className="py-3 px-4 text-right">Actions</th>
              <th className="py-3 px-4">Kontrol</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-neutral-900 hover:bg-neutral-900/30">
                <td className="py-3 px-4 font-mono text-xs opacity-70">{a.id.slice(0, 8)}…</td>
                <td className="py-3 px-4 font-semibold">{a.symbol}</td>
                <td className="py-3 px-4">{a.timeframe}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded bg-neutral-800 text-xs">{a.type}</span>
                </td>
                <td className="py-3 px-4">{a.active ? "🟢 Active" : "⚪ Paused"}</td>
                <td className="py-3 px-4 text-xs">
                  {a.lastTriggeredAt ? new Date(a.lastTriggeredAt).toLocaleString() : "-"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => enable(a.id, !a.active)}
                      className="px-2 py-1 text-xs rounded border border-neutral-700 hover:bg-neutral-800"
                    >
                      {a.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => showHistory(a.id)}
                      className="px-2 py-1 text-xs rounded border border-neutral-700 hover:bg-neutral-800"
                    >
                      📜
                    </button>
                    <button
                      onClick={() => test(a.id)}
                      className="px-2 py-1 text-xs rounded border border-neutral-700 hover:bg-neutral-800"
                    >
                      🧪
                    </button>
                    <button
                      onClick={() => del(a.id)}
                      className="px-2 py-1 text-xs rounded border border-red-700 text-red-300 hover:bg-red-900/20"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4"><AlertsControl id={a.id} onResult={(m: any)=>console.log(m)} /></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center opacity-60 text-sm">
                  <div className="space-y-2">
                    <div>Henüz alert yok</div>
                    <a href="/technical-analysis" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                      Technical Analysis → Hızlı Uyarı
                    </a>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      {history && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-[720px] max-w-[95vw] bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">📜 Alert History</div>
              <button
                onClick={() => setHistory(null)}
                className="px-3 py-1 rounded border border-neutral-700 hover:bg-neutral-800"
              >
                Kapat
              </button>
            </div>
            <div className="text-xs mb-3 opacity-70 font-mono">{historyId}</div>
            <div className="max-h-[60vh] overflow-auto text-xs font-mono space-y-2">
              {history.length === 0 && (
                <div className="py-8 text-center opacity-60">Henüz trigger olmamış</div>
              )}
              {history.map((e, i) => (
                <div key={i} className="p-3 rounded bg-black/40 border border-neutral-900">
                  <div className="flex items-center justify-between mb-1">
                    <span className="opacity-70">{new Date(e.ts).toLocaleString()}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-800">{e.type}</span>
                  </div>
                  <div className="mb-2">
                    <b>{e.symbol}</b> ({e.timeframe}) • <i>{e.reason}</i>
                  </div>
                  {e.value && (
                    <pre className="whitespace-pre-wrap bg-black/60 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(e.value, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

