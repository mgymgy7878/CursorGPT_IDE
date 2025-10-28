/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  LiveTradePlanRequest, LiveTradePlanResponse, CanaryGates, CanaryThresholds
} from "@spark/types";
import { normalizeThresholds } from "@spark/types";
import { headerStr } from "../lib/http-helpers.js";
import { readJSON as readJSONFile, writeJSON as writeJSONFile } from "../lib/http-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function lastNonceDir(base: string): string | null {
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter(d => fs.existsSync(path.join(base,d,"plan.json")));
  if (!dirs.length) return null;
  return dirs.sort().slice(-1)[0] || null;
}

export default async function register(app: any) {
  const routePath = "/canary/live-trade.plan";
  const handler = async (req: any, reply: any) => {
    const tokenHdr = headerStr(req, "x-confirm-token");
    const roleHdr = headerStr(req, "x-user-role");
    const TOKEN = envStr("CONFIRM_TOKEN", "");
    const tokenVerified = !!(TOKEN && tokenHdr && tokenHdr === TOKEN);
    
    const body = (req.body ?? {}) as LiveTradePlanRequest;
    
    const KILL_SWITCH = (process.env.KILL_SWITCH ?? "0") === "1";
    const MIN_NOTIONAL = Number(process.env.MIN_NOTIONAL ?? 5);
    const PRICE_HINT = Number(process.env.PRICE_HINT_USDT ?? 60000);
    const DEF_SYMBOL = process.env.LIVE_SYMBOL ?? "BTCUSDT";
    const DEF_QTY = Number(process.env.LIVE_TINY_QTY ?? 0.00005);

    const base = path.resolve(process.cwd(), "evidence", "canary");
    const nonce = lastNonceDir(base) || new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const dir = path.join(base, nonce);
    const latencyPath = path.join(dir, "latency.json");
    const planPath = path.join(dir, "plan.json");
    const livePlanPath = path.join(dir, "live_plan.json");

    const latency = await readJSONFile<{ gates: CanaryGates }>(latencyPath);
    const plan = await readJSONFile<{ thresholds?: Partial<CanaryThresholds> }>(planPath);
    const thr = normalizeThresholds((plan?.thresholds as Partial<CanaryThresholds>) || {});
    
    const g = (latency?.gates ?? {}) as CanaryGates;
    const hasUnknown = [g.ack_p95_ms,g.event_to_db_p95_ms,g.ingest_lag_p95_s,g.seq_gap_total]
      .some(v => v === "unknown");
    const within = !hasUnknown &&
      typeof g.ack_p95_ms === "number" && g.ack_p95_ms < thr.ack_p95_ms &&
      typeof g.event_to_db_p95_ms === "number" && g.event_to_db_p95_ms < thr.event_to_db_p95_ms &&
      typeof g.ingest_lag_p95_s === "number" && g.ingest_lag_p95_s <= thr.ingest_lag_p95_s &&
      Number(g.seq_gap_total) === Number(thr.seq_gap_total);

    const symbol = body.symbol ?? DEF_SYMBOL;
    const qty = Number(body.qty ?? DEF_QTY);
    const side = body.side ?? "BUY";
    const allowLive = !!body.allowLive;
    const dryRun = body.dryRun !== false;

    const notionalOk = (qty * PRICE_HINT) >= MIN_NOTIONAL;
    const killSwitchOk = !KILL_SWITCH;
    const gatesOk = within;
    const rbacOk = (roleHdr || "").toLowerCase() === "admin";

    let accepted = killSwitchOk && gatesOk && notionalOk && rbacOk && tokenVerified && allowLive;
    let reason = accepted ? "ok" : [
      !killSwitchOk ? "kill_switch" : null,
      !gatesOk ? "gates_fail" : null,
      !notionalOk ? "notional_lt_min" : null,
      !rbacOk ? "rbac_denied" : null,
      !tokenVerified ? "token_invalid" : null,
      !allowLive ? "allowLive_false" : null,
    ].filter(Boolean).join(",");

    const wouldPlace = accepted ? {
      symbol,
      qty,
      side,
      provider: "binance-testnet" as const,
      mode: dryRun ? "simulate" as const : "real" as const,
    } : null;

    await writeJSONFile(livePlanPath, {
      ts: new Date().toISOString(),
      request: { symbol, qty, side, allowLive, dryRun },
      checks: { killSwitchOk, gatesOk, notionalOk, rbacOk, tokenVerified },
      decision: { accepted, reason },
      wouldPlace,
    });

    const resp: LiveTradePlanResponse = { 
      nonce, 
      accepted, 
      reason, 
      tokenVerified, 
      rbacOk, 
      gatesOk, 
      notionalOk, 
      evidence: { root: dir, live_plan: livePlanPath } 
    };
    return reply.send(resp);
  };

  app.post(routePath, handler);
  app.post("/api/canary/live-trade.plan", handler);
  app.post("/api/canary/live-plan", handler); // alias – UI farklı adla gelirse de 404 olmaz
} 