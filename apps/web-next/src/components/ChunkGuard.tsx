"use client";
import { useEffect } from "react";

/**
 * ChunkGuard - Sadece ChunkLoadError ve dynamic import fetch hatalarını yakalar
 *
 * DARALTILMIŞ KAPSAM:
 * - ChunkLoadError (Next.js chunk yükleme hatası)
 * - "Loading chunk ... failed/timeout" mesajları
 * - "Failed to fetch dynamically imported module" hataları
 *
 * DİĞER HATALAR: Next.js dev overlay'e bırakılır (preventDefault/stopPropagation YOK)
 */
export default function ChunkGuard() {
  useEffect(() => {
    const RELOAD_KEY = "__spark_chunk_reload__";

    // ChunkLoadError pattern'leri
    const isChunkError = (msg: string): boolean => {
      const normalized = msg.toLowerCase();
      return (
        /chunkloaderror/i.test(normalized) ||
        /loading chunk\s+\d+\s+failed/i.test(normalized) ||
        /loading chunk\s+\d+\s+timeout/i.test(normalized) ||
        /failed to fetch dynamically imported module/i.test(normalized) ||
        /chunk load failed/i.test(normalized)
      );
    };

    // Handle Promise rejections (ChunkLoadError from dynamic imports)
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      const msg = String((e?.reason as any)?.message ?? e?.reason ?? "");
      if (isChunkError(msg)) {
        // Tek seferlik reload (sessionStorage flag)
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          console.warn("[ChunkGuard] ChunkLoadError detected, reloading once:", msg);
          location.reload();
        } else {
          // İkinci seferde banner göster (gelecekte eklenebilir)
          console.error("[ChunkGuard] ChunkLoadError persisted after reload:", msg);
        }
      }
      // Diğer hatalar: Next.js dev overlay'e bırakılır (preventDefault YOK)
    };

    // Handle Error events (ChunkLoadError from script tags)
    const errorHandler = (e: ErrorEvent) => {
      const msg = String(e?.message || "");
      if (isChunkError(msg)) {
        // Tek seferlik reload (sessionStorage flag)
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          console.warn("[ChunkGuard] ChunkLoadError detected, reloading once:", msg);
          location.reload();
        } else {
          console.error("[ChunkGuard] ChunkLoadError persisted after reload:", msg);
        }
      }
      // Diğer hatalar: Next.js dev overlay'e bırakılır (preventDefault YOK)
    };

    window.addEventListener("unhandledrejection", rejectionHandler);
    window.addEventListener("error", errorHandler);

    return () => {
      window.removeEventListener("unhandledrejection", rejectionHandler);
      window.removeEventListener("error", errorHandler);
    };
  }, []);
  return null;
}
