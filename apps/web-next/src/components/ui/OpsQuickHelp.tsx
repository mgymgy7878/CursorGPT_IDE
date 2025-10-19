"use client";
import { useState } from "react";

export default function OpsQuickHelp() {
  const [open, setOpen] = useState(false);

  const links = [
    { title: "📚 Go-Live Playbook", path: "/GO_LIVE_PLAYBOOK.md" },
    { title: "🚨 Triage Matrix", path: "/TRIAGE_MATRIX.md" },
    { title: "✅ Quality Turnstile", path: "/QUALITY_TURNSTILE_CHECKLIST.md" },
    { title: "🔧 QA Hardening", path: "/QA_HARDENING_COMPLETE.md" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        aria-label="Ops Quick Help"
      >
        <span>🚑</span>
        <span>Ops Hızlı Yardım</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Ops Dokümantasyon</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {links.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded transition-colors"
                >
                  {link.title}
                </a>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-800">
              <div className="text-xs text-neutral-500">
                <div className="font-semibold text-neutral-400 mb-1">Hızlı Komutlar:</div>
                <code className="block text-[10px] text-blue-400 mb-1">
                  bash scripts/green-room-check.sh
                </code>
                <code className="block text-[10px] text-blue-400">
                  bash scripts/monitor-live.sh
                </code>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

