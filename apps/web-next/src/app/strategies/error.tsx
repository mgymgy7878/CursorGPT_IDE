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
    <div className="min-h-screen grid place-items-center bg-black p-6">
      <div className="max-w-md border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2 text-white">Strateji Hatası</h2>
        <p className="text-neutral-400 mb-4">
          Stratejiler yüklenirken bir hata oluştu.
        </p>
        <pre className="text-xs bg-neutral-900 p-3 rounded mb-4 overflow-auto text-red-400">
          {error.message}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
        >
          Yeniden Dene
        </button>
      </div>
    </div>
  );
}

