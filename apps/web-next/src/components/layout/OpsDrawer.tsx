"use client";
import React from "react";

export function OpsDrawer() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button 
        className="rounded-lg px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        onClick={() => setOpen(true)}
      >
        Ops Hızlı Yardım
      </button>
      
      {open && (
        <div className="ops-drawer fixed inset-0 z-[90]">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setOpen(false)} 
          />
          <aside className="absolute right-0 top-0 h-full w-[380px] bg-neutral-950 border-l border-neutral-800 p-4 overflow-y-auto">
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Ops Dokümantasyon</h3>
              <button 
                className="text-neutral-400 hover:text-neutral-200 text-xl"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </header>
            
            <nav className="space-y-2 text-sm">
              <a className="block rounded-md bg-neutral-900 p-3 hover:bg-neutral-800 transition-colors">
                📄 Go-Live Playbook
              </a>
              <a className="block rounded-md bg-neutral-900 p-3 hover:bg-neutral-800 transition-colors">
                ⚠️ Triage Matrix
              </a>
              <a className="block rounded-md bg-neutral-900 p-3 hover:bg-neutral-800 transition-colors">
                ✅ Quality Turnstile
              </a>
              <a className="block rounded-md bg-neutral-900 p-3 hover:bg-neutral-800 transition-colors">
                🔧 QA Hardening
              </a>
            </nav>
            
            <div className="mt-4 border-t border-neutral-800 pt-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400">Hızlı Komutlar</p>
              <pre className="rounded-lg bg-neutral-900 p-3 text-xs text-neutral-300">
                bash scripts/green-room-check.sh
              </pre>
              <pre className="mt-2 rounded-lg bg-neutral-900 p-3 text-xs text-neutral-300">
                bash scripts/monitor-live.sh
              </pre>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
