"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { classifyFetchError, getErrorUI, type ClassifiedError } from "@/lib/errorClassifier";
import GlobalSystemBanner from "@/components/dashboard/GlobalSystemBanner";

// Use same-origin proxy (no CORS)

type ExecutorStatus = {
  running: boolean;
  runId?: string;
  strategyId?: string;
  symbol?: string;
  timeframe?: string;
  mode?: string;
  lastCandleTs?: number;
  lastDecisionTs?: number;
  lastSignal?: { type: string; ts: number; price: number; reason: string };
  pnl?: number;
  position?: { side: string; qty: number; entryPrice: number };
  equity?: number;
  loopIntervalMs?: number;
  lastError?: string;
};

export default function RunningPage() {
  const [status, setStatus] = useState<ExecutorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [classifiedError, setClassifiedError] = useState<ClassifiedError | null>(null);
  const [lastOkAt, setLastOkAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exec/status");
      if (!res.ok) {
        const error = classifyFetchError(new Error(`HTTP ${res.status}`), res);
        setClassifiedError(error);
        setStatus({ running: false });
        return;
      }
      const data = await res.json();
      setStatus(data);
      setClassifiedError(null);
      setLastOkAt(Date.now());
    } catch (err: any) {
      const error = classifyFetchError(err, null);
      setClassifiedError(error);
      setStatus({ running: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStop = async () => {
    if (!status?.runId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/exec/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: status.runId }),
      });
      if (!res.ok) throw new Error("Failed to stop");
      await fetchStatus();
    } catch (err: any) {
      const error = classifyFetchError(err, null);
      setClassifiedError(error);
    } finally {
      setBusy(false);
    }
  };

  const getRiskLevel = (strategyId?: string): "low" | "medium" | "high" => {
    // Default to medium for ema_rsi_v1
    return "medium";
  };

  // Executor offline kontrolü (GlobalSystemBanner için)
  const executorReachable = !classifiedError || classifiedError.category !== "executor-offline";

  const handleStartExecutor = () => {
    console.info("[Running] Start executor requested");
    // TODO: Ops drawer'ı aç veya /api/exec/start çağır
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Çalışan Stratejiler" desc="Aktif stratejileri görüntüle ve yönet" />

      {/* Global System Banner (Executor OFFLINE durumunda tek CTA) */}
      <GlobalSystemBanner
        executorReachable={executorReachable}
        onStartExecutor={handleStartExecutor}
      />

      {/* Sınıflandırılmış Hata UI */}
      {classifiedError && (
        <div className="bg-red-950/20 border border-red-800 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-red-400 font-semibold mb-1">
                {getErrorUI(classifiedError).title}
              </div>
              <div className="text-red-300/80 text-sm">
                {getErrorUI(classifiedError).message}
              </div>
              {lastOkAt && (
                <div className="text-red-400/60 text-xs mt-2">
                  Son başarılı: {new Date(lastOkAt).toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getErrorUI(classifiedError).cta && (
                <>
                  {getErrorUI(classifiedError).cta?.action === "retry" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchStatus}
                      disabled={loading || busy}
                      className="border-red-700 text-red-300 hover:bg-red-950/30"
                    >
                      Yeniden Dene
                    </Button>
                  )}
                  {/* CTA GlobalSystemBanner'da gösteriliyor, burada tekrar gösterme */}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {status?.running ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white font-semibold">{status.strategyId || "Unknown Strategy"}</div>
              <StatusBadge status="success" label="RUNNING" />
            </div>
            <div className="text-sm text-neutral-400 mb-3">
              {status.symbol} {status.timeframe} • {status.mode || "paper"}
            </div>

            {/* Status Details */}
            <div className="space-y-2 mb-4 text-xs">
              {status.lastCandleTs && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Last Candle:</span>
                  <span className="text-neutral-100">
                    {new Date(status.lastCandleTs).toLocaleTimeString()} ({Math.floor((Date.now() - status.lastCandleTs) / 1000)}s ago)
                  </span>
                </div>
              )}
              {status.lastDecisionTs && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Last Decision:</span>
                  <span className="text-neutral-100">
                    {new Date(status.lastDecisionTs).toLocaleTimeString()} ({Math.floor((Date.now() - status.lastDecisionTs) / 1000)}s ago)
                  </span>
                </div>
              )}
              {status.position && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Position:</span>
                  <span className="text-neutral-100">
                    {status.position.side.toUpperCase()} {status.position.qty} @ {status.position.entryPrice.toFixed(2)}
                  </span>
                </div>
              )}
              {status.pnl !== undefined && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">PnL:</span>
                  <span className={status.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {status.pnl >= 0 ? "+" : ""}{status.pnl.toFixed(2)} USDT
                  </span>
                </div>
              )}
              {status.equity && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Equity:</span>
                  <span className="text-neutral-100">{status.equity.toFixed(2)} USDT</span>
                </div>
              )}
              {status.lastError && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Error:</span>
                  <span className="text-red-400 text-[10px]">{status.lastError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button disabled={busy || loading} onClick={handleStop} className="bg-red-600 hover:bg-red-700">
                Durdur
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-neutral-400">Şu anda çalışan strateji yok.</div>
      )}
    </div>
  );
}

