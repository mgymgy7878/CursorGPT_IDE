"use client";
import { useState } from "react";
import { Play, Square, Power, Zap, AlertTriangle, Settings } from "lucide-react";
import { canExecuteClient } from "@/lib/auth-client";

export default function QuickActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const enabled = canExecuteClient();

  const handleAction = async (action: string) => {
    if (!enabled) {
      alert("Demo mode'da bu işlem devre dışı");
      return;
    }

    setLoading(action);
    try {
      const response = await fetch(`/api/public/canary/${action.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        next: { revalidate: 0 }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${action} başarılı: ${result.message || "İşlem tamamlandı"}`);
      } else {
        const error = await response.json();
        alert(`${action} hatası: ${error.error || "Bilinmeyen hata"}`);
      }
    } catch (error: any) {
      alert(`${action} hatası: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          <div className={`badge ${enabled ? 'badge-success' : 'badge-warning'}`}>
            {enabled ? 'Active' : 'Demo'}
          </div>
        </div>
      </div>

      <div className="card-body space-y-3">
        <button
          onClick={() => handleAction("ARM")}
          disabled={!enabled || loading === "ARM"}
          data-enabled={enabled}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            enabled 
              ? "btn-primary disabled:opacity-50 disabled:cursor-not-allowed" 
              : "bg-zinc-700/50 text-zinc-400 cursor-not-allowed border border-zinc-600/50"
          }`}
          title={!enabled ? "Demo mode'da devre dışı" : "Sistemi ARM et"}
        >
          <Play className="w-4 h-4" />
          <span>{loading === "ARM" ? "Arming..." : "ARM"}</span>
        </button>

        <button
          onClick={() => handleAction("STOP")}
          disabled={!enabled || loading === "STOP"}
          data-enabled={enabled}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            enabled 
              ? "btn-danger disabled:opacity-50 disabled:cursor-not-allowed" 
              : "bg-zinc-700/50 text-zinc-400 cursor-not-allowed border border-zinc-600/50"
          }`}
          title={!enabled ? "Demo mode'da devre dışı" : "Sistemi durdur"}
        >
          <Square className="w-4 h-4" />
          <span>{loading === "STOP" ? "Stopping..." : "STOP"}</span>
        </button>

        <button
          onClick={() => handleAction("CLOSEOUT")}
          disabled={!enabled || loading === "CLOSEOUT"}
          data-enabled={enabled}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            enabled 
              ? "bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
              : "bg-zinc-700/50 text-zinc-400 cursor-not-allowed border border-zinc-600/50"
          }`}
          title={!enabled ? "Demo mode'da devre dışı" : "Tüm pozisyonları kapat"}
        >
          <Power className="w-4 h-4" />
          <span>{loading === "CLOSEOUT" ? "Closing..." : "CLOSEOUT"}</span>
        </button>

        <button
          onClick={() => handleAction("SIMULATE_TRIP")}
          disabled={!enabled || loading === "SIMULATE_TRIP"}
          data-enabled={enabled}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            enabled 
              ? "btn-outline hover:bg-red-600 hover:border-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" 
              : "bg-zinc-700/50 text-zinc-400 cursor-not-allowed border border-zinc-600/50"
          }`}
          title={!enabled ? "Demo mode'da devre dışı" : "TRIP simülasyonu"}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{loading === "SIMULATE_TRIP" ? "Simulating..." : "SIMULATE TRIP"}</span>
        </button>
      </div>

      {!enabled && (
        <div className="card-body border-t border-zinc-800/50 bg-blue-900/10">
          <div className="flex items-center space-x-2 text-sm">
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">Demo Mode</span>
          </div>
          <div className="text-xs text-blue-300 mt-1">
            Actions: {process.env.NEXT_PUBLIC_DEMO_ENABLE_ACTIONS === "true" ? "Enabled" : "Disabled"}
          </div>
          <div className="text-xs text-blue-300 mt-1">
            Demo modda aksiyonlar devre dışı. Üretim için ayarları kontrol edin.
          </div>
        </div>
      )}
    </div>
  );
} 