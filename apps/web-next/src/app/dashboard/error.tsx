"use client";

import * as React from "react";

/**
 * Dashboard Error Boundary - Chunk timeout ve diğer hatalar için escape hatch
 * Kullanıcı "chunk patladı → uygulama dondu" yerine "hata oldu ama kontrol bende" hissini yaşar
 */

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  React.useEffect(() => {
    // Teşhis: Boş ekran segment error boundary'den mi? Bu log görünüyorsa segment crash.
    console.error("[dashboard] segment error boundary hit", error);
    console.error("[dashboard:error]", error);

    // Chunk timeout tespiti
    const isChunkTimeout =
      error.message?.includes("Loading chunk") ||
      error.message?.includes("timeout") ||
      error.message?.includes("chunk");

    if (isChunkTimeout) {
      console.warn(
        "[DashboardError] Chunk timeout detected. Possible causes:",
        "1) Dev server compile stall",
        "2) Large client bundle",
        "3) Circular dependency",
        "4) HMR cache corruption"
      );
    }
  }, [error]);

  const isChunkTimeout =
    error.message?.includes("Loading chunk") ||
    error.message?.includes("timeout") ||
    error.message?.includes("chunk");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 p-6 pointer-events-none">
      {/* Overlay: arka plan pointer-events-none, kart pointer-events-auto */}
      {/* Sol nav her zaman tıklanabilir kalmalı (fatal error olsa bile) */}
      <div className="max-w-2xl w-full rounded-2xl border border-red-500/30 bg-neutral-900 p-6 pointer-events-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-2xl">⚠</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-400">Dashboard Hatası</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Dashboard yüklenirken bir hata oluştu.
            </p>
          </div>
        </div>

        {/* Chunk timeout özel mesajı */}
        {isChunkTimeout && (
          <div className="mb-4 p-4 rounded-lg bg-amber-950/30 border border-amber-800/50">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-lg">💡</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-300 mb-1">
                  Chunk Yükleme Zaman Aşımı
                </div>
                <div className="text-xs text-amber-200/80">
                  Dashboard bileşenlerinden biri zamanında yüklenemedi. Bu genellikle geçici bir
                  sorundur. "Yeniden Dene" butonuna tıklayın veya sayfayı yenileyin.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hata detayları */}
        <div className="bg-neutral-950 rounded-lg p-4 mb-4 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Hata Detayları</span>
            {error.digest && (
              <span className="text-xs text-neutral-600">Digest: #{error.digest}</span>
            )}
          </div>
          <div className="text-xs text-neutral-300 font-mono break-all">
            {error.message || "Bilinmeyen hata"}
          </div>
        </div>

        {/* Aksiyon butonları */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Yeniden Dene
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            Sayfayı Yenile
          </button>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            Ana Sayfa
          </button>
          {isChunkTimeout && (
            <button
              onClick={() => {
                // Hard reload (cache bypass)
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
            >
              Hard Reload (Cache Bypass)
            </button>
          )}
        </div>

        {/* İpucu */}
        <div className="mt-4 p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
          <div className="flex items-start gap-2">
            <span className="text-neutral-500 text-sm">💡</span>
            <div className="text-xs text-neutral-400">
              {isChunkTimeout
                ? "İpucu: Chunk timeout genellikle dev server'ın compile sırasında kilitlenmesi veya büyük client bundle'dan kaynaklanır. Hard reload deneyin."
                : "İpucu: Beklenmeyen hata. Lütfen sayfayı yenileyin veya ana sayfaya dönün."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
