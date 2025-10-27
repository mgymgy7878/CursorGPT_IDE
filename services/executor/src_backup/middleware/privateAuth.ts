import type { Request, Response, NextFunction } from "express";
import { hmac256, signString } from "../utils/hmac";
// import { checkAndMark } from "@spark/common";
import { privateMetrics } from "../metrics";

const KEY = process.env.PRIVATE_API_KEY ?? "dev-key";
const SEC = process.env.PRIVATE_API_SECRET ?? "dev-secret";
const DRIFT = +(process.env.PRIVATE_TS_DRIFT_MS ?? 5000);
const NONCE_TTL = +(process.env.PRIVATE_NONCE_TTL_MS ?? 60000);
const RPS = +(process.env.PRIVATE_RPS ?? 5);
const BURST = +(process.env.PRIVATE_BURST ?? 10);

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, number[]>();
const rateLimiter = (key: string) => {
  const now = Date.now();
  const hits = rateLimitStore.get(key) ?? [];
  // Clean old entries (older than 1 second)
  const recent = hits.filter(t => now - t < 1000);
  if (recent.length >= BURST) {
    return false; // Rate limited
  }
  recent.push(now);
  rateLimitStore.set(key, recent);
  return true; // Allowed
};

export function privateAuth(req: Request, res: Response, next: NextFunction) {
  const k = req.header("X-API-KEY") ?? "";
  const ts = req.header("X-API-TS") ?? "";
  const nonce = req.header("X-API-NONCE") ?? "";
  const sig = req.header("X-API-SIGN") ?? "";
  const now = Date.now();
  const tsNum = +ts;

  if (!k || !ts || !nonce || !sig) { 
    privateMetrics.authTotal("fail"); 
    return res.status(401).json({ ok: false, err: "MISSING_HEADERS" }); 
  }
  
  if (k !== KEY) { 
    privateMetrics.authTotal("fail"); 
    return res.status(401).json({ ok: false, err: "BAD_KEY" }); 
  }
  
  if (!Number.isFinite(tsNum) || Math.abs(now - tsNum) > DRIFT) { 
    privateMetrics.authTotal("fail"); 
    return res.status(401).json({ ok: false, err: "TS_DRIFT" }); 
  }

  // replay guard - temporarily disabled
  // if (!checkAndMark(`nonce:${k}:${nonce}`, NONCE_TTL)) { 
  //   privateMetrics.replayTotal(); 
  //   return res.status(409).json({ ok: false, err: "REPLAY" }); 
  // }

  // rate limit
  if (!rateLimiter(k)) {
    privateMetrics.rateLimitedTotal(); 
    return res.status(429).json({ ok: false, err: "RATE_LIMIT" }); 
  }

  const path = req.originalUrl?.split("?")[0] || "";
  const body = (req.method === "GET" ? "" : JSON.stringify(req.body ?? {}));
  const msg = signString(req.method, path, ts, nonce, body);
  const expect = hmac256(SEC, msg);

  // Debug log for all requests
  console.log(`[${new Date().toISOString()}] Private auth: ${req.method} ${path} - match: ${expect === sig}`);

  if (expect !== sig) { 
    privateMetrics.authTotal("fail"); 
    return res.status(401).json({ ok: false, err: "BAD_SIG" }); 
  }

  privateMetrics.authTotal("ok");
  const start = Date.now();
  res.on("finish", () => privateMetrics.observeLatency(Date.now() - start));
  next();
} 