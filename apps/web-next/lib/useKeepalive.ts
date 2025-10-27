import { useEffect, useRef } from "react";

export function useKeepalive(url = "/api/futures/time", everyMs = 30_000) {
  const timer = useRef<number | null>(null);
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try { await fetch(url, { cache: "no-store" }); } catch {}
      if (!stopped) timer.current = window.setTimeout(tick, everyMs);
    };
    timer.current = window.setTimeout(tick, 1_000);
    return () => { stopped = true; if (timer.current) clearTimeout(timer.current); };
  }, [url, everyMs]);
}


