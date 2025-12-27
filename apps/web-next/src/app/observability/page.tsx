"use client";

import { Suspense } from "react";
import ObservabilityCards from "@/features/observability/ObservabilityCards";

function SafeBoundary({ children }: { children: React.ReactNode }) {
  try {
    return <>{children}</>;
  } catch (err) {
    console.error("Observability render error:", err);
    return (
      <div role="status" className="p-4 border border-neutral-800 rounded-lg">
        Observability verisi yüklenemedi
      </div>
    );
  }
}

export default function ObservabilityPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold mb-1">Observability</h1>
        <p className="text-xs text-neutral-400">Real-time system health and metrics</p>
      </div>
      <Suspense fallback={<div role="status" aria-label="Loading metrics">Loading metrics...</div>}>
        <SafeBoundary>
          <ObservabilityCards />
        </SafeBoundary>
      </Suspense>
    </main>
  );
}
