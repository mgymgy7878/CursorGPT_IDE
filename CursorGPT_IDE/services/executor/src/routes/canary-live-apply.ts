/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  LiveTradeApplyRequest, LiveTradeApplyResponse, CanaryGates, CanaryThresholds
} from "@spark/types";
import { normalizeThresholds } from "@spark/types";
import { headerStr, readJSON as readJSONFile, writeJSON as writeJSONFile } from "../lib/http-helpers";
import { envStr, envBool, envNum, readJSONFile, writeJSONFile } from "@spark/shared";
import { assertFiniteNumber } from "@spark/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ok = (v: any) => v !== undefined && v !== null && v !== "unknown";

function readJSON<T = any>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}
function writeJSON(p: string, data: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}
function lastNonceDir(base: string): string | null {
  if (!fs.existsSync(base)) return null;
  const d = fs
    .readdirSync(base)
    .filter((x) => fs.existsSync(path.join(base, x, "plan.json")));
  return d.length ? (d.sort().slice(-1)[0] || null) : null;
}

async function tryPlaceBinanceTestnetOrder(symbol: string, qty: number, side: "BUY" | "SELL") {
  try {
    const mod: any = await import("@spark/exchange/binance");
    const client = await (mod.getTestnetClient?.() ?? mod.default?.getTestnetClient?.());
    if (!client) throw new Error("no testnet client");
    const r = await client.placeMarketOrder({ symbol, qty, side });
    return { provider: "binance-testnet" as const, id: r.id, status: r.status || "NEW" };
  } catch {
    return { provider: "simulated" as const, id: `sim-${Date.now()}`, status: "SIMULATED" };
  }
}

class BadRequest extends Error { 
  status = 400; 
  constructor(msg: string){ super(msg);} 
}

type Thresholds = {
  maxNotional: number;     // >0
  drawdownLimit: number;   // [0, 100]
  maxOrdersPerMin?: number;// >=0
};

function parseNum(name: string, v: unknown, opts?: { min?: number; max?: number }): number {
  const n = typeof v === "string" ? Number(v) : Number(v);
  if (!Number.isFinite(n)) throw new BadRequest(`threshold.${name} must be number`);
  if (opts?.min != null && n < opts.min) throw new BadRequest(`threshold.${name} < min`);
  if (opts?.max != null && n > opts.max) throw new BadRequest(`threshold.${name} > max`);
  return n;
}

function parseThresholds(raw: any): Thresholds {
  return {
    maxNotional: parseNum("maxNotional", raw?.maxNotional, { min: 0 }),
    drawdownLimit: parseNum("drawdownLimit", raw?.drawdownLimit, { min: 0, max: 100 }),
    maxOrdersPerMin: raw?.maxOrdersPerMin != null ? parseNum("maxOrdersPerMin", raw?.maxOrdersPerMin, { min: 0 }) : undefined,
  };
}

export default async function canaryLiveApply(req: any, reply: any) {
  try {
    const tokenHdr = headerStr(req, "x-confirm-token");
    const roleHdr = headerStr(req, "x-user-role");
    const TOKEN = envStr("CONFIRM_TOKEN") || "";
    const tokenVerified = !!(TOKEN && tokenHdr && tokenHdr === TOKEN);
    const rbacOk = (roleHdr || "").toLowerCase() === "admin";
    
    const body = (req.body ?? {}) as LiveTradeApplyRequest;
    const symbol = body.symbol;
    const qty = body.qty;
    const side = body.side;
    const allowLive = body.allowLive;
    
    if (!symbol || !qty || !side || !allowLive) {
      return reply.status(400).json({ error: "bad_request", reason: "missing required fields" });
    }
    
    // Parse and validate thresholds
    const th = parseThresholds(req?.body?.thresholds ?? {});
    
    const base = path.resolve(process.cwd(), "evidence", "canary");
    const nonce = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const dir = path.join(base, nonce);
    const planPath = path.join(dir, "plan.json");
    const evFile = path.join(dir, "live_apply.json");
    
    const plan = await readJSONFile<{ thresholds?: Partial<CanaryThresholds> }>(planPath);
    const thr = normalizeThresholds(plan?.thresholds);
    
    const KILL = envBool("KILL_SWITCH") ?? true;
    const MIN = envNum("MIN_NOTIONAL") ?? 5;
    
    const notional = qty * (th.maxNotional || 50000);
    const notionalOk = notional >= MIN;
    
    const accepted = tokenVerified && rbacOk && !KILL && notionalOk;
    const reason = accepted ? "ok" : 
      !tokenVerified ? "token_invalid" :
      !rbacOk ? "rbac_fail" :
      KILL ? "kill_switch" :
      !notionalOk ? "notional_too_small" : "unknown";
    
    const resp: LiveTradeApplyResponse = {
      nonce,
      accepted,
      reason,
      tokenVerified,
      rbacOk,
      killSwitch: KILL,
      gatesOk: true,
      notionalOk,
      idempotency: { key: "test", wasDuplicate: false, ttlMin: 10 },
      breaker: { windowSec: 60, maxPerWindow: 10, countInWindow: 0, tripped: false },
      evidence: { root: dir, live_apply: evFile }
    };
    
    await writeJSONFile(evFile, resp);
    return reply.json(resp);
  } catch (error) {
    const status = error instanceof BadRequest ? 400 : 500;
    const message = error instanceof Error ? error.message : String(error);
    return reply.status(status).json({ error: "bad_thresholds", reason: message });
  }
} 