"use client";

/**
 * RuntimeHealthCard - Operasyonel Görünürlük Widget
 *
 * Tek kaynak (single source of truth) operasyon widget'ı:
 * - Dashboard ve /control sayfalarında reuse edilir
 * - UI/Executor/WS/Evidence Index durumunu tek kartta gösterir
 * - Production-proof: cache/no-store + timeout/degraded + jitter + last-known-state
 *
 * İleride başka sayfalarda da reuse edilebilir (ops widget olarak konumlandırılmış).
 */
import { useEffect, useState } from "react";
import { Surface } from "@/components/ui/Surface";
import { cardHeader, subtleText } from "@/styles/uiTokens";
import { useExecutorHealth } from "@/hooks/useExecutorHealth";
import { useMarketStore } from "@/stores/marketStore";
import { cn } from "@/lib/utils";

interface EvidenceIndexStatus {
  exists: boolean;
  lastModified: string | null;
  lastUpdate: string | null;
  ageSeconds: number | null;
  error?: string;
}

export function RuntimeHealthCard() {
  const executorHealth = useExecutorHealth();
  const executorOk = executorHealth.healthy;
  const executorStatus = executorHealth.status; // 'healthy' | 'degraded' | 'down'
  const wsStatus = useMarketStore((s) => s.status);
  const wsStaleness = useMarketStore((s) => s.gauges?.spark_ws_staleness_seconds ?? 0);
  const [evidenceIndex, setEvidenceIndex] = useState<EvidenceIndexStatus | null>(null);
  const [evidenceIndexError, setEvidenceIndexError] = useState(false);
  const [uiStatus, setUiStatus] = useState<"healthy" | "unknown">("healthy");

  // Check Evidence Index status with polling + jitter
  useEffect(() => {
    let cancelled = false;

    const checkEvidenceIndex = async () => {
      try {
        const res = await fetch("/api/evidence/index", { cache: "no-store" });
        if (cancelled) return;
        const data: EvidenceIndexStatus = await res.json();
        setEvidenceIndex(data);
        setEvidenceIndexError(false);
      } catch (err) {
        if (cancelled) return;
        // Keep last known state, just mark error
        setEvidenceIndexError(true);
      }
    };

    // Initial check
    checkEvidenceIndex();

    // Polling with jitter (3-5s ± 200ms)
    const baseInterval = 4000; // 4s base (3-5s aralığı: 3000-5000ms)
    const jitter = () => Math.random() * 400 - 200; // ±200ms
    const scheduleNext = () => {
      const timeout = setTimeout(() => {
        if (!cancelled) {
          checkEvidenceIndex();
          scheduleNext();
        }
      }, baseInterval + jitter());
      return timeout;
    };

    const timeoutId = scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // UI status (always healthy if page loads)
  useEffect(() => {
    setUiStatus("healthy");
  }, []);

  const formatTime = (timestamp: string | null, ageSeconds?: number | null) => {
    if (!timestamp) return "N/A";
    try {
      // Use ageSeconds if provided (more accurate), otherwise calculate from timestamp
      const age = ageSeconds !== null && ageSeconds !== undefined
        ? ageSeconds
        : Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

      const diffMinutes = Math.floor(age / 60);
      const diffHours = Math.floor(age / 3600);
      const diffDays = Math.floor(age / 86400);

      // Relative format (UTC consistent - timestamp is already UTC)
      if (diffMinutes < 1) {
        return "Az once";
      } else if (diffMinutes < 60) {
        return `${diffMinutes} dk once`;
      } else if (diffHours < 24) {
        return `${diffHours} saat once`;
      } else {
        return `${diffDays} gun once`;
      }
    } catch {
      return timestamp;
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    const isHealthy = typeof status === "boolean" ? status : status === "healthy" || status === "connected";
    return isHealthy ? "✅" : "❌";
  };

  const getStatusText = (status: boolean | string) => {
    if (typeof status === "boolean") {
      return status ? "UP" : "DOWN";
    }
    if (status === "healthy" || status === "connected") {
      return "Connected";
    }
    if (status === "degraded") {
      return "Degraded";
    }
    return "Disconnected";
  };

  const getWSStatusText = () => {
    // Separate connection status from last message time
    if (wsStatus === "healthy") {
      if (wsStaleness > 0) {
        // Show both connection status and last message time
        return `${Math.floor(wsStaleness)}s once`;
      }
      return "Connected";
    }
    return "Disconnected";
  };

  return (
    <Surface variant="card" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={cardHeader}>Runtime Health</div>
      </div>
      <div className="space-y-2">
        {/* UI Status */}
        <div className="flex items-center justify-between">
          <span className={subtleText}>UI (3003)</span>
          <div className="flex items-center gap-2">
            <span>{getStatusIcon(uiStatus)}</span>
            <span className="text-sm">{getStatusText(uiStatus)}</span>
          </div>
        </div>

        {/* Executor Status */}
        <div className="flex items-center justify-between">
          <span className={subtleText}>Executor (4001)</span>
          <div className="flex items-center gap-2">
            <span>{getStatusIcon(executorOk && executorStatus !== "degraded")}</span>
            <span
              className="text-sm"
              title={
                executorHealth.requestId || executorHealth.buildCommit
                  ? `Request: ${executorHealth.requestId || "—"}\nBuild: ${executorHealth.buildCommit || "—"}`
                  : undefined
              }
            >
              {getStatusText(executorStatus === "degraded" ? "degraded" : executorOk)}
            </span>
          </div>
        </div>

        {/* WebSocket Status */}
        <div className="flex items-center justify-between">
          <span className={subtleText}>WS Baglantisi</span>
          <div className="flex items-center gap-2">
            <span>{getStatusIcon(wsStatus === "healthy")}</span>
            <span className="text-sm">{getWSStatusText()}</span>
          </div>
        </div>

        {/* Evidence Index */}
        <div className="flex items-center justify-between">
          <span className={subtleText}>Evidence Index</span>
          <div className="flex items-center gap-2">
            <span>{getStatusIcon(evidenceIndex?.exists ?? false)}</span>
            <span className="text-sm">
              {evidenceIndex?.exists
                ? (() => {
                    // Gate ↔ UI senkronu: 24 saat eşiği (Gate'deki ile aynı)
                    const ageHours = evidenceIndex.ageSeconds !== null && evidenceIndex.ageSeconds !== undefined
                      ? evidenceIndex.ageSeconds / 3600
                      : null;
                    const isStale = ageHours !== null && ageHours > 24;
                    const timeText = formatTime(evidenceIndex.lastModified || evidenceIndex.lastUpdate || null, evidenceIndex.ageSeconds);
                    return isStale ? (
                      <span className="text-amber-400" title={`24 saatten eski (${Math.floor(ageHours)} saat once guncellenmis, 24 saatten eski)`}>
                        {timeText} ⚠
                      </span>
                    ) : timeText;
                  })()
                : "Yok"}
            </span>
            {evidenceIndexError && (
              <span className="text-xs text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20" title="Veri guncellenemedi">
                ⚠
              </span>
            )}
          </div>
        </div>
      </div>
    </Surface>
  );
}

