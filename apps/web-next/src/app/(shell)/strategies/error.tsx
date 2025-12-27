"use client";

import { useEffect } from "react";

export default function StrategiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Strategies Error]", error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="max-w-md border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2 text-white">Stratejiler sayfası hata verdi</h2>
        <p className="text-neutral-400 mb-4">
          Stratejiler yüklenirken bir hata oluştu. Lütfen yeniden deneyin.
        </p>
        <pre className="text-xs bg-neutral-900 p-3 rounded mb-4 overflow-auto text-red-400 max-h-48">
          {error.message}
          {error.digest && `\n\nDigest: ${error.digest}`}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors text-sm"
          >
            Yeniden Dene
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors text-sm inline-flex items-center"
          >
            Ana Sayfa
          </a>
        </div>
      </div>
    </div>
  );
}

