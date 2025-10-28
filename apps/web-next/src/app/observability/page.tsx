import ObservabilityCards from "@/features/observability/ObservabilityCards";

export default function ObservabilityPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Observability</h1>
        <p className="text-neutral-400">Real-time system health and metrics</p>
      </div>
      <ObservabilityCards />
    </main>
  );
}
