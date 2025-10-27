import crypto from "crypto";
import { FastifyInstance, FastifyRequest } from "fastify";
import type { Registry } from "../lib/metrics";

type LiveToken = {
  token: string;
  maxNotional: number;
  maxOrders: number;
  symbols: string[];
  expiresAt: number; // epoch ms
  note?: string;
};

export default async function strategyLiveRoutes(app: FastifyInstance, opts: any) {
  const registry: Registry = (app as any).metricsRegistry;
  let killSwitchArmed = false;
  const tokens = new Map<string, LiveToken>();

  // metrics
  const { Gauge } = await import("../lib/metrics");
  const gaugeArmed = new Gauge({
    name: "executor_kill_switch_armed",
    help: "Kill-switch armed (0/1)"
  });
  const gaugeLiveSessions = new Gauge({
    name: "executor_live_sessions",
    help: "Active live session tokens"
  });
  if (registry && typeof registry.registerMetric === 'function') {
    registry.registerMetric(gaugeArmed);
    registry.registerMetric(gaugeLiveSessions);
  }
  const refreshMetrics = () => {
    gaugeArmed.set(killSwitchArmed ? 1 : 0);
    gaugeLiveSessions.set(tokens.size);
  };

  // status
  app.get("/strategy/kill-switch", async () => ({ ok: true, armed: killSwitchArmed }));

  // arm/disarm
  app.post("/strategy/kill-switch", async (req) => {
    const body = (req.body ?? {}) as { armed: boolean; reason?: string };
    killSwitchArmed = !!body.armed;
    refreshMetrics();
    // not: burada isterseniz açık canlı emirleri iptal etmeyi tetikleyebilirsiniz
    return { ok: true, armed: killSwitchArmed, reason: body.reason ?? "" };
  });

  // prepare live session (double-confirm sonrası çağrılır)
  app.post("/strategy/live/prepare", async (req) => {
    if (killSwitchArmed) return app.httpErrors.locked("Kill-switch armed");
    const b = (req.body ?? {}) as {
      maxNotional: number; maxOrders: number; symbols: string[]; note?: string;
      ttlMinutes?: number;
    };
    const ttl = Math.min(Math.max(b.ttlMinutes ?? 30, 5), 120); // 5–120 dk
    const token = crypto.randomBytes(16).toString("hex");
    const entry: LiveToken = {
      token,
      maxNotional: Math.max(1, Number(b.maxNotional || 1)),
      maxOrders: Math.max(0, Number(b.maxOrders || 0)),
      symbols: Array.isArray(b.symbols) ? b.symbols : [],
      note: b.note,
      expiresAt: Date.now() + ttl * 60_000
    };
    tokens.set(token, entry);
    refreshMetrics();
    return { ok: true, token, expiresAt: entry.expiresAt };
  });

  // internal helper: doğrulama (run endpoint'inde kullanmak üzere export'lanır)
  app.decorate("validateLiveToken", (hdrToken: string, payload: any) => {
    if (killSwitchArmed) throw app.httpErrors.locked("Kill-switch armed");
    if (!hdrToken) throw app.httpErrors.unauthorized("Missing X-Live-Token");
    const t = tokens.get(hdrToken);
    if (!t) throw app.httpErrors.unauthorized("Invalid or expired live token");
    if (Date.now() > t.expiresAt) { tokens.delete(hdrToken); refreshMetrics(); throw app.httpErrors.unauthorized("Live token expired"); }
    // sunucu tarafı limitler
    if (payload?.budgetNotional && Number(payload.budgetNotional) > t.maxNotional)
      throw app.httpErrors.forbidden("budgetNotional exceeds live token cap");
    if (payload?.maxOrders && Number(payload.maxOrders) > t.maxOrders)
      throw app.httpErrors.forbidden("maxOrders exceeds live token cap");
    if (t.symbols.length && payload?.symbols && !payload.symbols.every((s: string)=> t.symbols.includes(s)))
      throw app.httpErrors.forbidden("symbol not allowed by live token");
    // riskGuard zorunlu
    if (!payload?.riskGuard) throw app.httpErrors.forbidden("riskGuard must be true in live mode");
    return true;
  });

  // periyodik temizlik
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [k, v] of tokens) if (v.expiresAt < now) { tokens.delete(k); changed = true; }
    if (changed) refreshMetrics();
  }, 60_000);

  refreshMetrics();
}
