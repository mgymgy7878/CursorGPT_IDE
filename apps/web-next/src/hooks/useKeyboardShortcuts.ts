"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Global keyboard shortcuts hook
 * Supports vim-style navigation (g d, g s) and command shortcuts
 */
export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      // Vim-style navigation (g + key within 500ms)
      if (e.key === "g" && now - lastKeyTime < 500) {
        // g + d = Dashboard
        if (lastKey === "g") {
          e.preventDefault();
          router.push("/dashboard");
          lastKey = "";
          return;
        }
      }

      if (lastKey === "g" && e.key === "s" && now - lastKeyTime < 500) {
        // g + s = Strategy Lab
        e.preventDefault();
        router.push("/strategy-lab");
        lastKey = "";
        return;
      }

      if (lastKey === "g" && e.key === "r" && now - lastKeyTime < 500) {
        // g + r = Running
        e.preventDefault();
        router.push("/running");
        lastKey = "";
        return;
      }

      if (lastKey === "g" && e.key === "m" && now - lastKeyTime < 500) {
        // g + m = Market
        e.preventDefault();
        router.push("/market");
        lastKey = "";
        return;
      }

      if (lastKey === "g" && e.key === "p" && now - lastKeyTime < 500) {
        // g + p = Portfolio
        e.preventDefault();
        router.push("/portfolio");
        lastKey = "";
        return;
      }

      // Track 'g' key for vim-style navigation
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        lastKey = "g";
        lastKeyTime = now;
        return;
      }

      // Reset if not 'g' or too much time passed
      if (e.key !== "g" || now - lastKeyTime > 500) {
        lastKey = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
