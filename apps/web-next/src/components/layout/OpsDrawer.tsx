"use client";
import { useEffect, useCallback, useState } from "react";

interface OpsDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

export function OpsDrawer({
  open: controlledOpen,
  onOpenChange,
  showButton = false,
}: OpsDrawerProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  // Stabilize setOpen with useCallback to avoid stale closures
  const setOpen = useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [controlledOpen, onOpenChange]
  );

  // ESC key handler - only when drawer is open
  useEffect(() => {
    if (!open) return; // Early return: no listener when closed (performance + avoid surprises)

    const handleEsc = (e: KeyboardEvent) => {
      // Guard: ignore ESC if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return; // Let the input handle ESC naturally (e.g., clear, blur)
      }

      // Guard: double-check drawer is still open (race condition protection)
      if (!open) return;

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, setOpen]);

  return (
    <>
      {showButton && (
        <button
          className="rounded-lg px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          onClick={() => setOpen(true)}
        >
          Ops Hızlı Yardım
        </button>
      )}

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
                aria-label="Kapat"
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
              <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400">
                Hızlı Komutlar
              </p>
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
