"use client";
import { useEffect } from "react";

export default function BacktestLabError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Backtest Lab Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center bg-black p-6">
      <div className="max-w-md border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2 text-white">Backtest Lab Hatası</h2>
        <p className="text-neutral-400 mb-4">
          Backtest Lab yüklenirken bir hata oluştu.
        </p>
        <pre className="text-xs bg-neutral-900 p-3 rounded mb-4 overflow-auto text-red-400 max-h-32">
          {error.message}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Yeniden Dene
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors inline-block"
          >
            Ana Sayfa
          </a>
        </div>
      </div>
    </div>
  );
}

