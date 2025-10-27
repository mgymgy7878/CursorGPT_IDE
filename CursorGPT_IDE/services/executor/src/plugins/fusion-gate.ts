// Contract-in-code: prefixed uçlar + root alias aynı handler'ı kullanır
import type { FastifyInstance, FastifyRequest } from "fastify";

export default async function fusionGate(app: FastifyInstance) {
  const statusHandler = async () => ({
    ok: true,
    score: 0,
    band: "LOW",
    mode: process.env.FUSION_GATE_MODE ?? "shadow",
  });

  const applyHandler = async (req: FastifyRequest) => ({
    ok: true,
    dry: true,
    band: "LOW",
    score: 0,
    applied: "dry-run",
  });

  // 1) Resmi kontrat (mutlak path)
  app.get("/api/public/fusion/risk.gate/status", statusHandler);
  app.post("/api/public/fusion/risk.gate/apply", applyHandler);

  // 2) Uyumluluk alias (root)
  app.get("/risk.gate/status", statusHandler);
  app.post("/risk.gate/apply", applyHandler);

  // (Ops debug kanıtı — finalize'da kaldırın)
  // app.get("/api/public/fusion/_fg/status", async () => ({ ok: true, scope: "contract" }));
}
