import fs from "node:fs/promises";
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export const envStr = (k, def = "") => process.env[k] ?? def;
export const envBool = (k, def = false) => process.env[k] === "true" || (def && process.env[k] !== "false");
export const envNum = (k, def = 0) => Number(process.env[k]) || def;
export const headerStr = (headers, key) => {
    const v = headers[key];
    return Array.isArray(v) ? v[0] || "" : v || "";
};
export async function readJSONFile(p) {
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt);
}
export async function writeJSONFile(p, data) {
    const txt = JSON.stringify(data, null, 2);
    await fs.writeFile(p, txt, "utf8");
}
export function assertFiniteNumber(x, name = "value") {
    if (typeof x !== "number" || !Number.isFinite(x))
        throw new Error(`${name} must be finite number`);
    return x;
}
export function safeStat(path) {
    try {
        const stats = require("fs").statSync(path);
        return { exists: true, size: stats.size };
    }
    catch {
        return { exists: false };
    }
}
export function ensureWithin(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function isRecord(x) {
    return typeof x === "object" && x !== null && !Array.isArray(x);
}
export function assertNever(x) { throw new Error(`Unexpected: ${String(x)}`); }
export class TokenBucket {
    capacity;
    tokens;
    refillRate; // tokens/sec
    lastRefill; // epoch ms
    constructor(capacity = 60, refillRate = 1) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }
    refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        const add = elapsed * this.refillRate;
        this.tokens = Math.min(this.capacity, this.tokens + add);
        this.lastRefill = now;
    }
    allow(count = 1) { this.refill(); if (this.tokens >= count) {
        this.tokens -= count;
        return true;
    } return false; }
    take(count = 1) { this.refill(); const taken = Math.min(this.tokens, count); this.tokens -= taken; return taken; }
}
//# sourceMappingURL=index.js.map