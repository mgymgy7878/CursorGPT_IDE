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
    console.error("[MarketDataError]", error);
    
    const info = [
      `Message: ${error?.message ?? "Unknown error"}`,
      error?.digest ? `Digest: #${error.digest}` : "",
      error?.stack ? `Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}` : "",
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
      <div className="max-w-lg w-full rounded-2xl border border-red-500/30 bg-neutral-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-red-400">Market Data Crash</h2>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          Piyasa verileri sayfası yüklenirken bir hata oluştu. Sayfayı yenileyebilir veya hatayı sıfırlayabilirsiniz.
        </p>
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
          <pre className="text-xs text-neutral-300 overflow-auto max-h-48 whitespace-pre-wrap">
            {errorInfo || String(error?.message ?? "Unknown error")}
          </pre>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => reset()} 
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
