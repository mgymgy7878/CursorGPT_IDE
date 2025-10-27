/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CanaryConfirmRequest, CanaryConfirmResponse, CanaryGates, CanaryThresholds
} from "@spark/types";
import { headerStr, envStr, readJSONFile } from "@spark/shared";
import { normalizeThresholds } from "@spark/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJSON<T=any>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}
function writeJSON(p: string, data: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function lastNonceDir(base: string): string | null {
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter(d => fs.existsSync(path.join(base,d,"plan.json")));
  if (!dirs.length) return null;
  return dirs.sort().slice(-1)[0] || null;
}

export default async function register(app: any) {
  const routePath = "/canary/confirm.plan";

  const handler = async (req: any, reply: any) => {
    const tokenHdr = headerStr(req, "x-confirm-token");
    const TOKEN = envStr("CONFIRM_TOKEN", "");
    const tokenVerified = !!(TOKEN && tokenHdr && tokenHdr === TOKEN);
    
    const body = (req.body ?? {}) as CanaryConfirmRequest;
    const mode = body.mode ?? "shadow";
    const allowLive = !!body.allowLive;
    const dryRun = body.dryRun !== false;

    const base = path.resolve(process.cwd(), "evidence", "canary");
    const nonce = lastNonceDir(base) || new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const dir = path.join(base, nonce);
    const latencyPath = path.join(dir, "latency.json");
    const planPath = path.join(dir, "plan.json");

    const latency = await readJSONFile<{ gates: CanaryGates }>(latencyPath);
    const plan = await readJSONFile<{ thresholds?: Partial<CanaryThresholds> }>(planPath);
    const thr = normalizeThresholds(plan?.thresholds);
    const g = (latency?.gates ?? {}) as CanaryGates;
    const hasUnknown = [g.ack_p95_ms,g.event_to_db_p95_ms,g.ingest_lag_p95_s,g.seq_gap_total]
      .some(v => v === "unknown");
    const within = !hasUnknown &&
      typeof g.ack_p95_ms === "number" && g.ack_p95_ms < thr.ack_p95_ms &&
      typeof g.event_to_db_p95_ms === "number" && g.event_to_db_p95_ms < thr.event_to_db_p95_ms &&
      typeof g.ingest_lag_p95_s === "number" && g.ingest_lag_p95_s <= thr.ingest_lag_p95_s &&
      Number(g.seq_gap_total) === Number(thr.seq_gap_total);

    let accepted = within;
    let reason = within ? "thresholds_ok" : (hasUnknown ? "unknown_metrics" : "threshold_violation");

    if (mode === "live") {
      if (!allowLive) { accepted = false; reason = "allowLive_false"; }
      else if (!tokenVerified) { accepted = false; reason = "token_invalid"; }
    }

    const resp: CanaryConfirmResponse = { 
      nonce, 
      accepted, 
      reason, 
      tokenVerified 
    };
    return reply.send(resp);
  };

  (app as any).post?.(routePath, handler) ?? (app as any).route?.({ method: 'POST', url: routePath, handler });
} 