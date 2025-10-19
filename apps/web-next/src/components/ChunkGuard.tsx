"use client";
import { useEffect } from "react";

export default function ChunkGuard() {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = String((e?.reason as any)?.message ?? e?.reason ?? "");
      if (/ChunkLoadError/i.test(msg) || /Loading chunk\s+\d+\s+failed/i.test(msg)) {
        const k = "__spark_chunk_reload__";
        if (!sessionStorage.getItem(k)) {
          sessionStorage.setItem(k, "1");
          location.reload();
        }
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return null;
}
