import { FastifyInstance } from "fastify";
import { getGuardrails, setGuardrails } from "../state/guardrails";
import { guardrailsKillSwitchGauge } from "../metrics";
import type { Guardrails } from "../types/guardrails";

export default async function (app: FastifyInstance) {
  app.get("/guardrails", async () => {
    return getGuardrails();
  });

  app.post<{
    Body: Partial<{
      killSwitch: boolean;
      maxExposurePct: number;
      whitelist: string[];
    }>;
  }>("/guardrails", async (req) => {
    const updates = req.body || {};

    // Validate maxExposurePct range
    if (updates.maxExposurePct !== undefined) {
      updates.maxExposurePct = Math.max(
        0,
        Math.min(100, updates.maxExposurePct)
      );
    }

    const updated = setGuardrails(updates);
    guardrailsKillSwitchGauge.set(updated.killSwitch ? 1 : 0);
    return updated;
  });
}
