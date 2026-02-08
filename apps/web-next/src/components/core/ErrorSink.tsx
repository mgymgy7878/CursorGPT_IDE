"use client";
import { useEffect, useRef, useState } from "react";

const MAX_DEV_ERRORS = 3;
const isProd = process.env.NEXT_PUBLIC_DEBUG !== "true";

interface ErrorRecord {
  message: string;
  count: number;
  lastSeen: number;
  source?: string;
}

export default function ErrorSink() {
  const [errs, setErrs] = useState<ErrorRecord[]>([]);
  const shown = useRef(0);
  const errorMapRef = useRef<Map<string, ErrorRecord>>(new Map());

  useEffect(() => {
    const push = (msg: string, source?: string) => {
      if (isProd) return;                 // prod'da bastır
      if (shown.current >= MAX_DEV_ERRORS) return; // dev'de 3 adet

      // Dedupe: Aynı (source|message) tekrar geldiyse count++ ve lastSeen güncelle
      const key = `${source || 'unknown'}|${msg}`;
      const existing = errorMapRef.current.get(key);

      if (existing) {
        existing.count++;
        existing.lastSeen = Date.now();
        errorMapRef.current.set(key, existing);
        setErrs(Array.from(errorMapRef.current.values()));
      } else {
        shown.current += 1;
        const record: ErrorRecord = { message: msg, count: 1, lastSeen: Date.now(), source };
        errorMapRef.current.set(key, record);
        setErrs(Array.from(errorMapRef.current.values()));
        console.error("[UI]", msg, source ? `[${source}]` : '');
      }
    };

    const clearErrors = (source?: string) => {
      // Dashboard başarılı fetch sonrası: sadece ilgili source'un hatalarını temizle
      if (source) {
        const keysToDelete: string[] = [];
        errorMapRef.current.forEach((record, key) => {
          if (record.source === source) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach((key) => errorMapRef.current.delete(key));
        setErrs(Array.from(errorMapRef.current.values()));
        shown.current = Math.max(0, shown.current - keysToDelete.length);
      } else {
        // Global clear
        errorMapRef.current.clear();
        setErrs([]);
        shown.current = 0;
      }
    };

    const onErr = (e: ErrorEvent) => {
      const msg = e?.message ?? "Unknown window error";
      push(msg, 'window');
      // ChunkLoadError tespiti
      if (msg.includes("Loading chunk") || msg.includes("chunk")) {
        console.warn("[ErrorSink] ChunkLoadError detected. Possible causes: cache mismatch, chunk 404");
      }
    };
    const onRej = (e: PromiseRejectionEvent) => {
      const reason = e?.reason;
      const msg = reason?.message ?? reason ?? "Unhandled rejection";
      push(msg.toString(), 'promise');
      // Promise rejection'ları console'a yaz (async hatalar error boundary'ye düşmeyebilir)
      console.error("[ErrorSink] Unhandled promise rejection:", reason);
    };

    // Dashboard fetch success event listener
    const onFetchSuccess = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      clearErrors(detail?.source || 'dashboard');
    };

    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    window.addEventListener("dashboard:fetch-success", onFetchSuccess);

    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      window.removeEventListener("dashboard:fetch-success", onFetchSuccess);
    };
  }, []);

  if (isProd || errs.length === 0) return null;

  const totalCount = errs.reduce((sum, e) => sum + e.count, 0);

  return (
    <div
      className="fixed left-4 bottom-4 z-[1000] rounded-xl bg-red-500/90 text-white px-3 py-2 shadow-lg"
      role="alert"
      aria-live="assertive"
      aria-label={`${totalCount} error${totalCount > 1 ? "s" : ""} occurred`}
    >
      {totalCount} error{totalCount > 1 ? "s" : ""} ({errs.length} unique) – detaylar console'da
    </div>
  );
}
