import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const BEARER = process.env.EXECUTOR_TOKEN || "";
const HMAC_SECRET = process.env.EXECUTOR_HMAC_SECRET || "";
const MODE = process.env.EXECUTOR_AUTH_MODE || "bearer";

function unauthorized(res: Response) {
  return res.status(401).json({ ok: false, code: "unauthorized" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health and metrics endpoints
  if (req.path === "/api/public/health" || req.path === "/api/public/metrics/prom") {
    return next();
  }

  if (MODE === "bearer") {
    const auth = req.get("authorization") || "";
    if (!auth.startsWith("Bearer ") || auth.slice(7) !== BEARER) {
      return unauthorized(res);
    }
    return next();
  }

  if (MODE === "hmac") {
    const ts = req.get("x-timestamp");
    const sig = req.get("x-signature");
    
    if (!ts || !sig) {
      return unauthorized(res);
    }

    // Check timestamp skew (5 minutes)
    const skew = Math.abs(Date.now() - Number(ts));
    if (isNaN(Number(ts)) || skew > 300_000) {
      return unauthorized(res);
    }

    // Get raw body for HMAC verification
    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) {
      return unauthorized(res);
    }

    // Calculate expected signature
    const expect = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(Buffer.concat([raw, Buffer.from("." + ts)]))
      .digest("hex");

    // Timing-safe comparison
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) {
      return unauthorized(res);
    }

    return next();
  }

  return unauthorized(res);
} 