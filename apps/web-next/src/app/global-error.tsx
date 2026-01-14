"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: { error: Error & { digest?: string }, reset: () => void }) {
  const [errorInfo, setErrorInfo] = useState<string>("");

  useEffect(() => {
    // Dev'de kök hatayı console'a yaz, prod'da ErrorSink zaten sınırlar
    // eslint-disable-next-line no-console
    console.error("[GlobalError]", error);

    // Error bilgisini topla
    const info = [
      `Message: ${error?.message ?? "Unknown error"}`,
      error?.digest ? `Digest: #${error.digest}` : "",
      error?.stack ? `Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}` : "",
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
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
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>UI Crash - Spark Trading</title>
      </head>
      <body className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="max-w-2xl w-full rounded-2xl border border-red-500/30 bg-neutral-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-xl">⚠</span>
            </div>
            <h2 className="text-xl font-semibold text-red-400">UI Crash</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-4">
            Uygulama beklenmeyen bir hata nedeniyle durdu. Sayfayı yenileyebilir veya hatayı sıfırlayabilirsiniz.
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
            <pre className="text-xs text-neutral-300 overflow-auto max-h-64 whitespace-pre-wrap">
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
              Ana Sayfa
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
