"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // ChunkLoadError tespiti: bir kezlik hard reload ile cache/SW uyumsuzluğunu temizle
  useEffect(() => {
    const message = `${error?.message ?? ''} ${error?.name ?? ''}`;
    if (/ChunkLoadError/i.test(message) || /Loading chunk\s+\d+\s+failed/i.test(message)) {
      const reloadOnceKey = "__spark_chunk_reload__";
      if (!sessionStorage.getItem(reloadOnceKey)) {
        sessionStorage.setItem(reloadOnceKey, "1");
        location.reload();
      } else {
        sessionStorage.removeItem(reloadOnceKey);
      }
    }
  }, [error]);
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Beklenmeyen hata (500)</h1>
        <p className="mt-2 text-muted-foreground">
          {process.env.NODE_ENV === "development" ? error.message : "Bir şeyler ters gitti."}
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 px-4 py-2 rounded-md border"
        >
          Tekrar Dene
        </button>
        <button
          onClick={() => location.reload()}
          className="ml-3 mt-6 px-4 py-2 rounded-md border"
        >
          Tam Yeniden Yükle
        </button>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";


