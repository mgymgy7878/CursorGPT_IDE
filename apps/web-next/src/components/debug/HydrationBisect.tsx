/**
 * HydrationBisect - Debug component for isolating hydration mismatch sources
 *
 * Usage:
 * 1. Set NEXT_PUBLIC_HYDRATION_BISECT=1
 * 2. Set NEXT_PUBLIC_HYDRATION_GATES="topbar,main" (comma-separated gate names)
 * 3. Wrap suspected components: <HydrationBisect name="topbar"><TopBar /></HydrationBisect>
 *
 * If a gate is enabled, the component renders as ClientOnly (null on server).
 * This allows binary search to find which subtree causes hydration mismatch.
 */
"use client";

import { ClientOnly } from "@/components/ui/ClientOnly";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface HydrationBisectProps {
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Bisect Debug Badge - Görsel kanıt (bisect aktif mi kontrol etmek için)
 */
export function HydrationBisectBadge() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const bisectEnabled = process.env.NEXT_PUBLIC_HYDRATION_BISECT === "1";
  if (!bisectEnabled) return null;

  const gates = (process.env.NEXT_PUBLIC_HYDRATION_GATES || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  return (
    <div className="fixed top-2 left-2 z-[9999] px-2 py-1 bg-yellow-600 text-white text-xs font-mono rounded shadow-lg border border-yellow-400">
      BISECT ON · gates: {gates.length > 0 ? gates.join(",") : "(none)"}
    </div>
  );
}

export function HydrationBisect({ name, children, fallback = null }: HydrationBisectProps) {
  const bisectEnabled = process.env.NEXT_PUBLIC_HYDRATION_BISECT === "1";

  if (!bisectEnabled) {
    // Bisect kapalı: normal render (herhangi bir etki yok)
    return <>{children}</>;
  }

  // Bisect aktif: gate listesini kontrol et
  const gates = (process.env.NEXT_PUBLIC_HYDRATION_GATES || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const isGated = gates.includes(name);

  if (isGated) {
    // Bu gate aktif: ClientOnly render (server'da null, client'ta children)
    return <ClientOnly fallback={fallback}>{children}</ClientOnly>;
  }

  // Gate değil: normal render
  return <>{children}</>;
}

