"use client";

import { Suspense } from "react";
import GuardrailsPanel from "@/features/guardrails/GuardrailsPanel";

function SafeBoundary({ children }: { children: React.ReactNode }) {
  try {
    return <>{children}</>;
  } catch (err) {
    console.error("Guardrails render error:", err);
    return (
      <div role="status" className="p-4 border border-neutral-800 rounded-lg">
        Guardrails paneli yüklenemedi
      </div>
    );
  }
}

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Guardrails</h1>
      <Suspense fallback={<div role="status" aria-label="Loading guardrails">Loading guardrails...</div>}>
        <SafeBoundary>
          <GuardrailsPanel />
        </SafeBoundary>
      </Suspense>
    </main>
  );
}
