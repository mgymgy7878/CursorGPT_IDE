const fp = require('fastify-plugin');

module.exports = fp(async function (app) {
  app.get("/risk.gate/status", async () => ({
    ok: true,
    score: 0,
    band: "LOW",
    mode: process.env.FUSION_GATE_MODE ?? "shadow"
  }));

  app.post("/risk.gate/apply", async () => ({
    ok: true,
    dry: true,
    band: "LOW",
    score: 0,
    applied: "dry-run"
  }));

  // 🔬 İzolasyon testi (GEÇİCİ): prefix'ten bağımsız root kontrolü
  app.get("/_fg/status", async () => ({ ok: true, scope: "root" }));
}, { name: 'fusion-gate' });
