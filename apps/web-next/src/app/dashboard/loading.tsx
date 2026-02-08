/**
 * Dashboard Loading Skeleton - Instant feedback during chunk/compile
 * Route-level Suspense boundary for App Router
 * Watchdog: 8-10 sn sonra "Hâlâ yükleniyor" CTA gösterir
 */

"use client";

import { useEffect, useState } from "react";

export default function DashboardLoading() {
  const [showWatchdog, setShowWatchdog] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Watchdog: 8 saniye sonra "Hâlâ yükleniyor" CTA göster
    const timer = setTimeout(() => {
      setShowWatchdog(true);
    }, 8000);

    // Elapsed time counter (debug için)
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden px-4 py-2 bg-neutral-950" data-page="dashboard-loading">
      {/* Fold-first: tek satır başlık, sayfa akışından taşma yok */}
      <div className="text-[11px] text-neutral-500 leading-tight mb-2 shrink-0" aria-live="polite">
        Dashboard yükleniyor…
      </div>
      {/* Debug: Elapsed (dev only) */}
      {process.env.NODE_ENV === 'development' && elapsed > 0 && (
        <div className="fixed top-14 right-4 z-50 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] text-amber-400 font-mono">
          {elapsed}s
        </div>
      )}
      {/* Ticker skeleton - ince */}
      <div className="h-8 w-full bg-neutral-900 rounded animate-pulse shrink-0 mb-2" />

      {/* 2 satır grid - DashboardV2 ile aynı yapı, viewport'a sığar */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="col-span-8 row-span-1 min-h-0 rounded-lg border border-neutral-800 bg-neutral-900/50 animate-pulse" />
        <div className="col-span-4 row-span-1 min-h-0 rounded-lg border border-neutral-800 bg-neutral-900/50 animate-pulse" />
        <div className="col-span-8 row-span-1 min-h-0 rounded-lg border border-neutral-800 bg-neutral-900/50 animate-pulse" />
        <div className="col-span-4 row-span-1 min-h-0 rounded-lg border border-neutral-800 bg-neutral-900/50 animate-pulse" />
      </div>

      {/* Watchdog: 8 saniye sonra "Hâlâ yükleniyor" CTA */}
      {showWatchdog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-neutral-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-2xl">⏱</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-amber-400">Hâlâ Yükleniyor</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Dashboard 8 saniyeden fazla süredir yükleniyor.
                </p>
              </div>
            </div>
            <div className="bg-neutral-950 rounded-lg p-4 mb-4 border border-neutral-800">
              <div className="text-xs text-neutral-300 space-y-1">
                <div>Olası nedenler:</div>
                <div>• Chunk yükleme hatası (cache mismatch)</div>
                <div>• Network timeout</div>
                <div>• Server render takıldı</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Sayfayı Yenile
              </button>
              <button
                onClick={() => {
                  // Hard reload (cache bypass)
                  window.location.href = window.location.href;
                }}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
              >
                Hard Reload (Cache Bypass)
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
              >
                Ana Sayfa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
