/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CanaryRunRequest, CanaryRunResponse, CanaryThresholds } from "@spark/types";
import { normalizeThresholds } from "@spark/types";
import { readJSONFile } from "@spark/shared";
import { isRecord } from "@spark/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function nonce(): string {
  const d = new Date();
  const ts = d.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const rand = Math.random().toString(16).slice(2, 8);
  return `${ts}-${rand}`;
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJSON(p: string, data: unknown) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function writeText(p: string, data: string) {
  fs.writeFileSync(p, data, 'utf8');
}

function parsePrometheusText(body: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of body.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const key = parts[0];
    const val = Number(parts[parts.length - 1]);
    if (!Number.isNaN(val) && key) out[key] = val;
  }
  return out;
}

async function fetchMetricsText(url: string, timeoutMs = 2500): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal as any });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function pickGate(metrics: Record<string, number>, names: string[]): number | 'unknown' {
  for (const n of names) {
    if (n in metrics) return metrics[n] || 0;
  }
  return 'unknown';
}

function first<T>(arr: T[] | null | undefined): T | null {
  return Array.isArray(arr) && arr.length > 0 ? (arr[0] ?? null) : null;
}

function barAt(arr: any[] | null | undefined, i: number): any | null {
  if (!Array.isArray(arr)) return null;
  const x = arr[i];
  return x ?? null;
}

function at<T>(arr: T[] | null | undefined, i: number): T | null {
  return Array.isArray(arr) && i >= 0 && i < arr.length ? (arr[i] ?? null) : null;
}

export default async function canaryRun(req: any, reply: any) {
  try {
    const body = (req.body ?? {}) as CanaryRunRequest;
    const dryRun = body.dryRun !== false;
    
    const base = path.resolve(process.cwd(), "evidence", "canary");
    const nonce = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const dir = path.join(base, nonce);
    const latencyPath = path.join(dir, "latency.json");
    const planPath = path.join(dir, "plan.json");
    
    const latency = await readJSONFile<{ gates: CanaryThresholds }>(latencyPath);
    const plan = await readJSONFile<{ thresholds?: Partial<CanaryThresholds> }>(planPath);
    
    const thr = normalizeThresholds(plan?.thresholds);
    const g = (latency?.gates ?? {}) as CanaryThresholds;
    
    const hasUnknown = [g.ack_p95_ms, g.event_to_db_p95_ms, g.ingest_lag_p95_s, g.seq_gap_total]
      .some(v => v === "unknown");
    
    const within = !hasUnknown &&
      typeof g.ack_p95_ms === "number" && g.ack_p95_ms < thr.ack_p95_ms &&
      typeof g.event_to_db_p95_ms === "number" && g.event_to_db_p95_ms < thr.event_to_db_p95_ms &&
      typeof g.ingest_lag_p95_s === "number" && g.ingest_lag_p95_s <= thr.ingest_lag_p95_s &&
      Number(g.seq_gap_total || 0) === Number(thr.seq_gap_total);
    
    const status = within ? "ARMED" : "WARNING";
    const decision = within ? "PROCEED" : "HOLD";
    
    const out: CanaryRunResponse = { 
      nonce, 
      status, 
      decision, 
      gates: thr 
    };
    
    return reply.json(out);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return reply.status(500).json({ error: message });
  }
} 