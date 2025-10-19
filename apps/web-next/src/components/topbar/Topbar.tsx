"use client";
import { useState } from "react";

type QuickAction = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
};

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      label: "Ayarlar",
      icon: "⚙️",
      href: "/settings"
    },
    {
      label: "Borsa Bağla",
      icon: "🔗",
      href: "/settings?tab=exchanges"
    },
    {
      label: "AI Anahtarı",
      icon: "🤖",
      href: "/settings?tab=ai"
    },
    {
      label: "Durum JSON",
      icon: "📄",
      onClick: async () => {
        try {
          const res = await fetch("/api/tools/get_status", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({})
          });
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `status-${new Date().toISOString().slice(0, 19)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Status JSON download failed:", e);
        }
      }
    }
  ];

  return (
    <div className="fixed top-0 right-0 z-30 p-4">
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="btn btn-sm flex items-center gap-2"
          aria-label="Hızlı menü"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Hızlı</span>
        </button>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg">
            <div className="p-2">
              {quickActions.map((action, i) => (
                <div key={i}>
                  {action.href ? (
                    <a
                      href={action.href}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800 rounded"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        action.onClick?.();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800 rounded text-left"
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-800 p-2 text-xs text-neutral-500">
              <div className="flex items-center justify-between">
                <span>K: Komut Paleti</span>
                <span className="text-xs">v1.0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
