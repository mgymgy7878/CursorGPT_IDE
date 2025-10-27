"use client";
import { useEffect, useState } from "react";
import { getAuthToken, getAuthHeaders } from "@/lib/auth";

type GateStatus = "PASS"|"FAIL"|"BLOCKED";
type GateRow = { id:string; label:string; status:GateStatus; value?:string|number; threshold?:string; details?:string; };
type Summary = { updatedAt:number; allPass:boolean; rows:GateRow[]; };

const badge = (s:GateStatus) =>
  s === "PASS" ? "bg-emerald-100 text-emerald-700"
: s === "FAIL" ? "bg-rose-100 text-rose-700"
: "bg-amber-100 text-amber-800";

export default function GatesPage() {
  const [data,setData] = useState<Summary|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);
  const [promoting,setPromoting] = useState(false);
  const isAuthenticated = !!getAuthToken();

  async function load() {
    try {
      const r = await fetch("/api/gates/summary", { cache:"no-store" });
      if (!r.ok) throw new Error("Özet alınamadı");
      const j = await r.json(); setData(j); setError(null);
    } catch(e:any){ setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, []);

  async function promote() {
    setPromoting(true);
    try {
      const r = await fetch("/api/gates/promote-request", { 
        method:"POST",
        headers: getAuthHeaders()
      });
      const j = await r.json();
      if (!r.ok) {
        if (r.status === 401) {
          alert("Yetki gerekli (ADMIN_TOKEN)");
        } else {
          alert(j?.error || "İstek başarısız");
        }
      } else {
        alert("Promote isteği kaydedildi ✅");
      }
    } finally { setPromoting(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Promote Gates</h1>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded text-sm ${data?.allPass ? "bg-emerald-600 text-white" : "bg-gray-200"}`}>
            {data?.allPass ? "6/6 PASS" : "Hazır değil"}
          </span>
          <button
            onClick={promote}
            disabled={!isAuthenticated || !data?.allPass || promoting}
            className={`px-4 py-2 rounded font-medium ${(!isAuthenticated || !data?.allPass||promoting) ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
            aria-disabled={!isAuthenticated || !data?.allPass || promoting}
            aria-label="Promote request"
            title={!isAuthenticated ? "Yetki gerekli (ADMIN_TOKEN)" : ""}
          >
            {promoting ? "Gönderiliyor..." : "Promote İsteği Gönder"}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Son güncelleme: {data?.updatedAt ? new Date(data.updatedAt).toLocaleString('tr-TR') : (loading ? "yükleniyor..." : "—")}
      </p>

      {error && <div className="p-3 rounded bg-rose-50 text-rose-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(data?.rows ?? Array.from({length:6}).map((_,i)=>({id:String(i),label:"Yükleniyor…",status:"BLOCKED"} as GateRow))).map((g,idx) => (
          <div key={g.id ?? idx} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium">{g.label}</h3>
              <span className={`px-2.5 py-1 rounded text-xs ${badge(g.status)}`}>{g.status}</span>
            </div>
            <div className="mt-3 text-sm text-gray-700">
              <div><span className="text-gray-500">Değer: </span>{g.value ?? "—"}</div>
              <div><span className="text-gray-500">Eşik: </span>{g.threshold ?? "—"}</div>
              {g.details && <div className="mt-2 text-amber-700">{g.details}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        Not: PSI & Shadow Delta gerçek metriklerden; Offline/Evidence dosya tabanlı doğrulanır. Prometheus entegrasyonu yapıldığında Alert Silence gate'i buraya bağlanabilir.
      </div>
    </div>
  );
}

