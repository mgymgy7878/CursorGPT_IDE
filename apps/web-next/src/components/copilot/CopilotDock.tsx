"use client";

import { useEffect } from "react";
import { useCopilotStore } from "@/stores/copilotStore";
import { useTranslation } from "@/i18n/useTranslation";

export default function CopilotDock() {
  const { open, mode, openWith, toggle, close } = useCopilotStore();
  const t = useTranslation("common");

  // Hotkey handler: Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <>
      {/* Floating Action Button (bottom-right) */}
      <button
        onClick={toggle}
        aria-label="Copilot"
        className="fixed right-4 bottom-4 z-50 rounded-2xl px-4 py-2 shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        💬 Copilot
      </button>

      {/* Drawer Modal */}
      {open && (
        <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="absolute right-0 top-0 h-full w-[420px] bg-zinc-900 border-l border-zinc-800 overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
              <div className="font-semibold text-lg">
                Copilot
                <span className="ml-2 text-xs text-zinc-500 uppercase">
                  {mode}
                </span>
              </div>
              <button
                onClick={close}
                aria-label="Kapat"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex gap-2">
                <button
                  onClick={() => openWith("analysis")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    mode === "analysis"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  📊 Analiz
                </button>
                <button
                  onClick={() => openWith("manage")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    mode === "manage"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  🧩 Yönet
                </button>
                <button
                  onClick={() => openWith("strategy")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    mode === "strategy"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  🧠 Strateji
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {mode === "analysis" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-zinc-300">
                    Piyasa Analizi
                  </h3>
                  <p className="text-sm text-zinc-500">
                    📊 Piyasa analizi, teknik göstergeler ve özetler buraya
                    gelecek.
                  </p>
                  <div className="text-xs text-zinc-600">
                    Yakında: BTC/USDT trend, RSI, MA analizi
                  </div>
                </div>
              )}

              {mode === "manage" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-zinc-300">
                    Sistem Yönetimi
                  </h3>
                  <p className="text-sm text-zinc-500">
                    🧩 Uygulama ve servis kontrolleri (API/WS/Engine) buraya
                    gelecek.
                  </p>
                  <div className="text-xs text-zinc-600">
                    Yakında: Kill switch, stratejileri durdur, log temizleme
                  </div>
                </div>
              )}

              {mode === "strategy" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-zinc-300">
                    Strateji Asistanı
                  </h3>
                  <p className="text-sm text-zinc-500">
                    🧠 Strateji üretici, parametre diff ve backtest tetikleyici
                    buraya gelecek.
                  </p>
                  <div className="text-xs text-zinc-600">
                    Yakında: AI prompt, parametre optimizasyonu, deploy asistanı
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
