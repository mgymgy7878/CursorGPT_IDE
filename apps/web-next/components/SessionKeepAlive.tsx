"use client";
import { useEffect, useRef } from "react";
import { apiRefresh } from "../lib/api";

const TEN_MIN = 10 * 60 * 1000;

export default function SessionKeepAlive() {
  const timer = useRef<number | NodeJS.Timeout | null>(null);

  useEffect(() => {
    const tick = async () => {
      try { await apiRefresh(); } catch { /* sessiz */ }
    };
    tick(); // mount anında bir kez
    timer.current = setInterval(tick, TEN_MIN) as any;
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    window.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer.current) clearInterval(timer.current as any);
      window.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
} 
