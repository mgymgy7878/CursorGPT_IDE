"use client";

import { useEffect, useState } from "react";

/**
 * Market Data Loading - 8 saniye watchdog ile "Hâlâ yükleniyor" CTA
 * Suspense fallback - route veri/JS beklerken otomatik gösterilir
 */
export default function MarketDataLoading() {
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
    <div className="h-full flex flex-col min-h-0 p-6 bg-neutral-950">
      {/* Siyah ekran önlemi: her zaman görünür başlık */}
      <div className="text-sm text-neutral-500 mb-2" aria-live="polite">
        Piyasa verileri yükleniyor…
      </div>
      {/* Debug: Elapsed time (sadece dev mode'da görünür) */}
      {process.env.NODE_ENV === 'development' && elapsed > 0 && (
        <div className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs text-amber-400 font-mono">
          Loading: {elapsed}s
        </div>
      )}

      <div className="space-y-4 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-neutral-900 rounded"></div>
          <div className="h-8 w-32 bg-neutral-900 rounded"></div>
        </div>

        {/* Chart area skeleton */}
        <div className="flex-1 min-h-[400px] bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="p-4 space-y-3">
            <div className="h-6 w-32 bg-neutral-800 rounded"></div>
            <div className="h-64 bg-neutral-800/50 rounded"></div>
            <div className="h-4 w-full bg-neutral-800/30 rounded"></div>
          </div>
        </div>

        {/* Info text */}
        <div className="text-center text-neutral-500 text-sm">
          Grafik yükleniyor...
        </div>
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
                  Market Data 8 saniyeden fazla süredir yükleniyor.
                </p>
              </div>
            </div>
            <div className="bg-neutral-950 rounded-lg p-4 mb-4 border border-neutral-800">
              <div className="text-xs text-neutral-300 space-y-1">
                <div>Olası nedenler:</div>
                <div>• Chunk yükleme hatası (cache mismatch)</div>
                <div>• Chart library init crash (lightweight-charts)</div>
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
                  window.location.href = "/dashboard";
                }}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
