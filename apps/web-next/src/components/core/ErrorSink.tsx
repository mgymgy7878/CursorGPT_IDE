"use client";
import { useEffect, useRef, useState } from "react";

const MAX_DEV_ERRORS = 3;
const isProd = process.env.NEXT_PUBLIC_DEBUG !== "true";

export default function ErrorSink() {
  const [errs, setErrs] = useState<string[]>([]);
  const shown = useRef(0);

  useEffect(() => {
    const push = (msg: string) => {
      if (isProd) return;                 // prod'da bastır
      if (shown.current >= MAX_DEV_ERRORS) return; // dev'de 3 adet
      shown.current += 1;
      setErrs((p) => [...p, msg]);
      console.error("[UI]", msg);
    };
    const onErr = (e: ErrorEvent) => push(e?.message ?? "Unknown window error");
    const onRej = (e: PromiseRejectionEvent) => push((e?.reason?.message ?? e?.reason ?? "Unhandled rejection").toString());
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  if (isProd || errs.length === 0) return null;
  return (
    <div className="fixed left-4 bottom-4 z-[1000] rounded-xl bg-red-500/90 text-white px-3 py-2 shadow-lg">
      {errs.length} error{errs.length>1?"s":""} – detaylar console'da
    </div>
  );
}
