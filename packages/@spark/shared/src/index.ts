import fs from "node:fs/promises";

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export const envStr = (k: string, def = ""): string => process.env[k] ?? def;
export const envBool = (k: string, def = false): boolean => process.env[k] === "true" || (def && process.env[k] !== "false");
export const envNum = (k: string, def = 0): number => Number(process.env[k]) || def;
export const headerStr = (headers: Record<string, string | string[]>, key: string): string => {
  const v = headers[key]; return Array.isArray(v) ? v[0] || "" : v || "";
};
export async function readJSONFile<T = unknown>(p: string): Promise<T> {
  const txt = await fs.readFile(p, "utf8"); return JSON.parse(txt) as T;
}
export async function writeJSONFile(p: string, data: unknown): Promise<void> {
  const txt = JSON.stringify(data, null, 2); await fs.writeFile(p, txt, "utf8");
}
export function assertFiniteNumber(x: unknown, name = "value"): number {
  if (typeof x !== "number" || !Number.isFinite(x)) throw new Error(`${name} must be finite number`);
  return x;
}
export function safeStat(path: string): { exists: boolean; size?: number } {
  try { const fs = require("fs"); const stats = fs.statSync(path); return { exists: true, size: stats.size }; }
  catch { return { exists: false }; }
}
export function ensureWithin(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
export function assertNever(x: never): never { throw new Error(`Unexpected: ${String(x)}`); }
export type Json = unknown;


export class TokenBucket {
  capacity: number;
  tokens: number;
  refillRate: number; // tokens/sec
  lastRefill: number; // epoch ms
  constructor(capacity = 60, refillRate = 1) {
    this.capacity = capacity; this.tokens = capacity; this.refillRate = refillRate; this.lastRefill = Date.now();
  }
  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const add = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + add);
    this.lastRefill = now;
  }
  allow(count = 1): boolean { this.refill(); if (this.tokens >= count) { this.tokens -= count; return true; } return false; }
  take(count = 1): number { this.refill(); const taken = Math.min(this.tokens, count); this.tokens -= taken; return taken; }
}

export type Role = "admin" | "trader" | "viewer";
