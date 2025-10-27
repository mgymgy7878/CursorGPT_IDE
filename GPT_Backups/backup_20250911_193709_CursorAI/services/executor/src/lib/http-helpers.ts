import { normalizeThresholds as normalizeThresholdsBase } from "@spark/types";
import fs from "node:fs/promises";
import path from "node:path";

export function headerStr(req: any, name: string): string | undefined {
  const raw = req?.headers?.[name];
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0] || undefined;
  return undefined;
}

export function normalizeThresholds(thr?: Partial<Record<string, unknown>>) {
  const d = { ack_p95_ms: 1000, event_to_db_p95_ms: 300, ingest_lag_p95_s: 2, seq_gap_total: 0 };
  const n = { ...d, ...(thr ?? {}) } as Record<string, unknown>;
  for (const k of Object.keys(d)) {
    const v = n[k];
    (n as any)[k] = (typeof v === "number" && Number.isFinite(v)) ? v : (d as any)[k];
  }
  return n as { ack_p95_ms:number; event_to_db_p95_ms:number; ingest_lag_p95_s:number; seq_gap_total:number };
}

export async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJSON(filePath: string, data: any): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf8');
} 