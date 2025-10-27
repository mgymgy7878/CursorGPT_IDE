"use client";
import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";

export default function Topbar() {
  const toggleCopilot = useUIStore((s) => s.toggleCopilot);
  const [compact, setCompact] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ui.compact") === "1";
  });

  // "Fit" → içerik konteynerini ekrana sığdırma (chromium'da güzel çalışır)
  function fitToView() {
    const root = document.getElementById("app-content");
    if (!root) return;
    root.style.transformOrigin = "top left";
    // önce resetle
    root.style.transform = "none";
    // 5ms sonra ölç → ölçekle
    requestAnimationFrame(() => {
      const sw = root.scrollWidth;
      const sh = root.scrollHeight;
      const scale = Math.min(window.innerWidth / sw, (window.innerHeight - 56) / sh, 1);
      root.style.transform = scale < 1 ? `scale(${scale})` : "none";
    });
  }

  useEffect(() => {
    document.documentElement.dataset.compact = compact ? "1" : "0";
    localStorage.setItem("ui.compact", compact ? "1" : "0");
  }, [compact]);

  return (
    <header className="h-14 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between px-3">
      <div className="font-medium text-slate-200">Spark Trading Platform</div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleCopilot}
          className="text-xs rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-800"
          title="Copilot Aç/Kapat"
        >
          Copilot
        </button>
        <button
          onClick={() => setCompact((v) => !v)}
          className="text-xs rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-800"
          title="Daha sıkı layout"
        >
          {compact ? "Comfort" : "Compact"}
        </button>
        <button
          onClick={fitToView}
          className="text-xs rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-800"
          title="Ekrana sığdır"
        >
          Fit
        </button>
      </div>
    </header>
  );
}
