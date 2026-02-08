"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import TraceId from "./TraceId";
import ActionDetailsPopover from "./ActionDetailsPopover";

type Action = {
  id: string;
  action: string;
  result: "ok" | "err";
  timestamp: number;
  details?: string;
  traceId?: string;
};

export default function RecentActions() {
  const router = useRouter();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    const baseInterval = 10_000; // 10 seconds
    const jitter = 1_500; // ±1.5s
    let alive = true;

    const load = async () => {
      if (alive) await loadActions();
    };

    load();
    const interval = setInterval(() => {
      if (alive) {
        setTimeout(load, Math.floor(Math.random() * jitter));
      }
    }, baseInterval);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  async function loadActions() {
    try {
      const res = await fetch("/api/audit/list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
        cache: "no-store"
      });
      const data = await res.json();
      setIsMock(!!data._mock);
      if (data._err && !data._mock) {
        console.warn("Audit API error:", data._err);
        setError(data._err);
        setActions([]);
      } else {
        setError(null);
        setActions(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load actions:", e);
      setError("Bağlantı hatası");
      setActions([]);
      setIsMock(false);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(timestamp: number) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }

  function getActionIcon(action: string) {
    if (action.includes("start")) return "▶️";
    if (action.includes("stop")) return "⏹️";
    if (action.includes("preview")) return "👁️";
    if (action.includes("backtest")) return "📊";
    if (action.includes("optimize")) return "🎯";
    if (action.includes("canary")) return "🧪";
    if (action.includes("generate")) return "🤖";
    if (action.includes("delete")) return "🗑️";
    return "⚡";
  }

  function getActionLabel(action: string) {
    const actionMap: Record<string, string> = {
      "strategy.start": "Strateji Başlatıldı",
      "strategy.stop": "Strateji Durduruldu",
      "strategy.preview": "Strateji Önizlendi",
      "strategy.generate": "AI Strateji Üretildi",
      "backtest.run": "Backtest Çalıştırıldı",
      "optimize.run": "Optimizasyon Başlatıldı",
      "canary.run": "Canary Test Çalıştırıldı",
      "strategy.delete": "Strateji Silindi",
      "ml.score": "ML Skor Hesaplandı",
      "optimization.promote": "Varyant Promote Edildi",
      "evidence.create": "Evidence Oluşturuldu",
      "evidence.archive": "Evidence Arşivlendi",
      "guardrails.breach": "Guardrail İhlali",
      "guardrails.auto_pause": "Otomatik Durdurma"
    };
    return actionMap[action] || action;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/50">
        <h3 className="text-lg font-semibold mb-4">📋 Son Aksiyonlar</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-6 w-6 bg-neutral-800 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-neutral-800 rounded w-3/4"></div>
                <div className="h-2 bg-neutral-800 rounded w-1/2"></div>
              </div>
              <div className="h-4 w-12 bg-neutral-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-800/30 p-4 bg-red-900/10">
        <h3 className="text-lg font-semibold mb-4 text-red-400">📋 Son Aksiyonlar</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">⚠️</div>
          <div className="text-sm text-red-400 mb-2">Audit verisi yüklenemedi</div>
          <div className="text-xs text-red-500 mb-4">
            {error}
          </div>
          <button
            onClick={loadActions}
            className="btn btn-sm btn-secondary"
          >
            🔄 Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/50">
        <h3 className="text-lg font-semibold mb-4">📋 Son Aksiyonlar</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-sm text-neutral-500 mb-2">Henüz aksiyon yok</div>
          <div className="text-xs text-neutral-600 mb-4">
            Strategy Lab'de işlem yaparak aksiyonları görebilirsiniz
          </div>
          <button
            onClick={() => {
              startTransition(() => {
                router.push("/strategy-lab");
              });
            }}
            className="btn btn-sm btn-primary"
          >
            🧪 Strategy Lab'e Git
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📋 Son Aksiyonlar</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadActions}
            className="text-xs text-neutral-500 hover:text-neutral-300"
            title="Yenile"
          >
            🔄
          </button>
        </div>
      </div>

      {isMock && (
        <div className="mb-2 px-2 py-1 rounded border border-amber-800/50 bg-amber-950/40 text-amber-300 text-xs">
          ⚠️ Demo verisi (Executor offline)
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {actions.map((action) => (
          <ActionDetailsPopover key={action.id} action={action}>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-help ${
                action.result === "ok"
                  ? "bg-green-900/20 border-green-800/30 hover:bg-green-900/30"
                  : "bg-red-900/20 border-red-800/30 hover:bg-red-900/30"
              }`}
            >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              action.result === "ok"
                ? "bg-green-900 text-green-400"
                : "bg-red-900 text-red-400"
            }`}>
              {action.result === "ok" ? "✓" : "✗"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {getActionIcon(action.action)}
                </span>
                <span className="text-sm font-medium text-neutral-300 truncate">
                  {getActionLabel(action.action)}
                </span>
              </div>

              {action.details && (
                <div className="text-xs text-neutral-500 truncate">
                  {action.details}
                </div>
              )}

              {action.traceId && (
                <div className="mt-0.5">
                  <TraceId traceId={action.traceId} />
                </div>
              )}
            </div>

            <div className="flex-shrink-0 text-xs text-neutral-500">
              {formatTime(action.timestamp)}
            </div>
            </div>
          </ActionDetailsPopover>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-800">
        <div className="flex justify-between items-center text-xs text-neutral-500">
          <span>Toplam: {actions.length}</span>
          <div className="flex items-center gap-4">
            <span className="text-green-400">
              ✓ {actions.filter(a => a.result === "ok").length}
            </span>
            <span className="text-red-400">
              ✗ {actions.filter(a => a.result === "err").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
