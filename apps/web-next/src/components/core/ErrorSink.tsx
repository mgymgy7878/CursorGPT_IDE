"use client";
import { useEffect, useRef, useState } from "react";

const MAX_DEV_ERRORS = 3;
const isProd = process.env.NEXT_PUBLIC_DEBUG !== "true";

// Hydration mismatch pattern'leri ignore et (Next.js dev overlay zaten gösteriyor)
const IGNORE_ERROR_PATTERNS: RegExp[] = [
  /Hydration failed because the initial UI does not match/i,
  /react-hydration-error/i,
  /Text content does not match server-rendered HTML/i,
  /Expected server HTML to contain a matching/i,
];

function normalizeMsg(x: unknown): string {
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

function shouldIgnore(msg: string): boolean {
  return IGNORE_ERROR_PATTERNS.some((re) => re.test(msg));
}

export default function ErrorSink() {
  const [errs, setErrs] = useState<string[]>([]);
  const shown = useRef(0);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const push = (raw: unknown) => {
      if (isProd) return; // prod'da bastır

      const msg = normalizeMsg(raw);
      if (!msg) return;

      // Hydration mismatch -> dev overlay gürültüsü, ErrorSink'te gösterme
      if (shouldIgnore(msg)) {
        console.warn("[UI] Ignored hydration error:", msg);
        return;
      }

      // Duplicate mesajları filtrele
      const key = msg.slice(0, 300);
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);

      if (shown.current >= MAX_DEV_ERRORS) return; // dev'de 3 adet
      shown.current += 1;
      setErrs((p) => [...p, msg]);
      console.error("[UI]", msg);
    };

    const onErr = (e: ErrorEvent) => push(e?.error?.message || e?.message);
    const onRej = (e: PromiseRejectionEvent) => push((e?.reason as any)?.message || e?.reason);

    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  if (isProd || errs.length === 0) return null;

  const handleDismiss = () => {
    seenRef.current.clear();
    setErrs([]);
    shown.current = 0;
  };

  return (
    <div className="fixed left-4 bottom-4 z-[1000] rounded-xl bg-red-500/90 text-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {errs.length} error{errs.length > 1 ? "s" : ""} – detaylar console'da
        </span>
        <button
          type="button"
          className="ml-2 rounded px-2 py-1 text-white/90 hover:text-white hover:bg-white/10 transition-colors"
          onClick={handleDismiss}
          aria-label="Hataları kapat"
          title="Kapat"
        >
          ×
        </button>
      </div>
    </div>
  );
}
