"use client";

import { useEffect, useState } from "react";

export default function MarketDataError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorInfo, setErrorInfo] = useState<string>("");

  useEffect(() => {
    // Teşhis: Boş ekran "segment crash" mı yoksa "chart init" mi? Bu log görünüyorsa segment error boundary devrede.
    console.error("[market-data] segment error boundary hit", error);
    console.error("[MarketDataError]", error);

    // "Missing Suspense boundary" hatasını özel olarak yakala
    const isSuspenseError = 
      error?.message?.includes("Suspense boundary") ||
      error?.message?.includes("useSearchParams") ||
      error?.message?.includes("usePathname");

    // error.message + error.stack tam göster
    const info = [
      `Message: ${error?.message ?? "Unknown error"}`,
      error?.digest ? `Digest: #${error.digest}` : "",
      error?.stack ? `Stack:\n${error.stack}` : "",
      isSuspenseError ? `\n💡 Bu hata genellikle useSearchParams/usePathname hook'larının Suspense boundary dışında kullanılmasından kaynaklanır. MarketDataParams component'i bu sorunu çözmek için oluşturuldu.` : "",
    ].filter(Boolean).join('\n\n');

    setErrorInfo(info);
  }, [error]);

  const copyError = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(errorInfo);
      alert("Hata bilgisi kopyalandı!");
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6 bg-neutral-950">
      <div className="max-w-2xl w-full rounded-2xl border border-red-500/30 bg-neutral-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-2xl">⚠</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-400">Market Data Crash</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Piyasa verileri sayfası yüklenirken bir hata oluştu.
            </p>
            {(error?.message?.includes("Suspense boundary") || error?.message?.includes("useSearchParams")) && (
              <p className="text-xs text-amber-400 mt-2">
                ⚠️ Suspense boundary hatası tespit edildi. Bu genellikle Next.js App Router'da useSearchParams kullanımından kaynaklanır.
              </p>
            )}
          </div>
        </div>
        <div className="bg-neutral-950 rounded-lg p-4 mb-4 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Hata Detayları</span>
            <button
              onClick={copyError}
              className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              Kopyala
            </button>
          </div>
          <pre className="text-xs text-neutral-300 overflow-auto max-h-64 whitespace-pre-wrap font-mono break-all">
            {errorInfo || String(error?.message ?? "Unknown error")}
          </pre>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
          >
            Hard Reload
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors inline-block text-center"
          >
            Dashboard
          </a>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-500">
            💡 Console'da (F12) daha fazla hata detayı görebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
