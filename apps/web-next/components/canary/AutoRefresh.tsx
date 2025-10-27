"use client";
import { useEffect, useRef } from "react";

export function AutoRefresh({
  enabled,
  setEnabled,
  intervalMs,
  onTick,
  lastRefreshed,
}: {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  intervalMs: number;
  onTick: () => void;
  lastRefreshed?: Date | null;
}) {
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      return;
    }
    onTick(); // açılır açılmaz bir kere çalıştır
    timer.current = window.setInterval(onTick, intervalMs) as unknown as number;
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [enabled, intervalMs]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Auto-Refresh ({Math.round(intervalMs / 1000)}s)
      </label>
      <span className="px-2 py-0.5 rounded-xl bg-slate-100">
        Son: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "—"}
      </span>
    </div>
  );
} 