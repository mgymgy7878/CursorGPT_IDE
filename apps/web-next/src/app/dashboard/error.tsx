"use client";
import { useEffect } from "react";

/**
 * Dashboard Error Boundary
 * Catches and displays dashboard-specific errors
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("[Dashboard Error]", error);
  }, [error]);

  // ⬇️ ZEKİ HATA TESPİTİ - GELİŞTİRİLMİŞ
  const isHooksOrder = error instanceof Error &&
    /Rendered more hooks than during the previous render/.test(error.message);
  const isHooksConditional = error instanceof Error &&
    /React Hook "use[A-Z]/.test(error.message);
  const isHooksLoop = error instanceof Error &&
    /React Hook "use[A-Z]"/.test(error.message) && 
    /loop/.test(error.message);
  
  const getHint = () => {
    if (isHooksOrder) return "Hook sırası bozulmuş. Tüm hook'ları üstte ve koşulsuz çağırın.";
    if (isHooksConditional) return "Koşullu hook çağrısı. Hook'ları koşul dışında çağırın.";
    if (isHooksLoop) return "Döngü içinde hook çağrısı. Tek state/dizi kullanın.";
    return "Beklenmeyen hata.";
  };
  
  const hint = getHint();

  return (
    <div className="min-h-screen grid place-items-center bg-black p-6">
      <div className="max-w-md border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2 text-white">Dashboard Hatası</h2>
        <p className="text-neutral-400 mb-4">
          Dashboard yüklenirken bir hata oluştu. Lütfen yeniden deneyin.
        </p>
        <pre className="text-xs bg-neutral-900 p-3 rounded mb-4 overflow-auto text-red-400">
          {error.message}
          {error.digest && `\n\nDigest: ${error.digest}`}
        </pre>
        {/* ⬇️ ZEKİ İPUCU */}
        <div className="mb-4 p-3 bg-amber-950/30 border border-amber-800/50 rounded text-amber-200 text-sm">
          <strong>💡 İpucu:</strong> {hint}
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Yeniden Dene
          </button>
          <a
            href="/"
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
          >
            Ana Sayfa
          </a>
        </div>
      </div>
    </div>
  );
}
