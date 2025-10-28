import GuardrailsPanel from "@/features/guardrails/GuardrailsPanel";

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Guardrails</h1>
      <GuardrailsPanel />
    </main>
  );
}
