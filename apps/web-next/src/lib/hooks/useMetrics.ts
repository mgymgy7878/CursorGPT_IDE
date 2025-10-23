"use client";
import { useEffect, useState } from "react";

export function useMetrics(){
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/public/metrics", { cache: "no-store" });
        if (!alive) return;
        setData(await r.json());
      } catch {}
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return data;
}


