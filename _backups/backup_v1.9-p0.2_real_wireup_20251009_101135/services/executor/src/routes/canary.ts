// services/executor/src/routes/canary.ts
import type { FastifyInstance } from "fastify";
import { hRouteTotal, hPlanBuild, hExtHttp, hJsonParse, hRespond, httpLatency } from "../metrics.js";

const now = () => performance.now();
export async function canaryRoutes(app: FastifyInstance) {
  // Canary handler'da zamanlama/observe
  app.get("/canary/run", async (req, reply) => {
    const end = httpLatency.startTimer({ route: '/canary/run', method: 'GET' });
    try {
      const t0 = now();
      const dry = (req.query as any)?.dry !== "false";

    const tA = now();
    const plan = [
      { symbol: "BTCUSDT", side: "BUY", type: "MARKET", notional: 50 },
      { symbol: "ETHUSDT", side: "SELL", type: "LIMIT", price: 9999, qty: 0.01 },
    ];
    hPlanBuild.observe(now() - tA);

    // Bu dry-run'da DIŞ HTTP YOK → "none"
    const tB = now();
    hExtHttp.labels("none").observe(now() - tB);

    const tC = now();
    // Büyük JSON parse yok → 0'a yakın
    hJsonParse.observe(now() - tC);

    const tD = now();
    const payload = { ok: true, mode: dry ? "dry" : "live", plan, guardrails: { killSwitch: true } };
    // Göndermeden ÖNCE ölç, send sonrası akışı bozma
    const respLatencyStart = now();
    const res = reply.code(200).send(payload);
    hRespond.observe(now() - respLatencyStart);

      hRouteTotal.labels(dry ? "dry" : "live").observe(now() - t0);
      return res;
    } finally {
      end({ status: '200' }); // <- observe!
    }
  });
}