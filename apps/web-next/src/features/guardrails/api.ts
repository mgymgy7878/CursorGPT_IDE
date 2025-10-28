export type Guardrails = {
  killSwitch: boolean;
  maxExposurePct: number;
  whitelist: string[];
};

export async function fetchGuardrails(): Promise<Guardrails> {
  const r = await fetch("/api/guardrails", { cache: "no-store" });
  return r.json();
}

export async function updateGuardrails(
  p: Partial<Guardrails>
): Promise<Guardrails> {
  const r = await fetch("/api/guardrails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return r.json();
}
