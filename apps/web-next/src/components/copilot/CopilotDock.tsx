"use client";
import { useState } from "react";

interface CopilotDockProps {
  open?: boolean;
  onToggle?: () => void;
}

export default function CopilotDock({ open = true, onToggle }: CopilotDockProps) {
  const [isOpen, setIsOpen] = useState(open);
  const arrow = isOpen ? "▲" : "▼"; // only on client

  const quickActions = [
    { label: "BTC/ETH trend analizi", icon: "📈" },
    { label: "Portföy risk özeti", icon: "⚠️" },
    { label: "Çalışan stratejiler sağlığı", icon: "💚" },
    { label: "Canlı Özet", icon: "📊" },
    { label: "Durum JSON", icon: "🔍" },
    { label: "Detay", icon: "📋" }
  ];

  return (
    <div className="h-dvh flex flex-col">
      <button
        type="button"
        onClick={() => { setIsOpen(v=>!v); onToggle?.(); }}
        className="w-full px-4 py-3 border-b border-neutral-800 text-left hover:bg-neutral-800/50 transition-colors"
      >
        <span suppressHydrationWarning>Copilot {arrow}</span>
      </button>

      {isOpen && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Actions Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-300">Hızlı Aksiyonlar</h3>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="flex items-center gap-3 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <span>{action.icon}</span>
                  <span className="text-xs">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Import & Search */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                İçe Aktar
              </button>
            </div>
            <input
              type="text"
              placeholder="Ara..."
              className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Content Area */}
          <div className="space-y-3">
            <div className="text-sm text-neutral-500">Kayıt yok.</div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            <button className="flex-1 px-3 py-2 text-sm text-neutral-300 border-b-2 border-blue-500">
              Stratejiler
            </button>
            <button className="flex-1 px-3 py-2 text-sm text-neutral-500 border-b-2 border-transparent hover:text-neutral-300">
              Açık Emirler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}