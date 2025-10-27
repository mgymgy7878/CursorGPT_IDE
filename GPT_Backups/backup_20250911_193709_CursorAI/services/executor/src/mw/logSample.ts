import type { Request, Response, NextFunction } from "express";

const pct = Number(process.env.LOG_SAMPLING_PCT || 0);
const piiKeys = new Set(
  (process.env.PII_REDACT_KEYS || "").split(",").map(s => s.trim()).filter(Boolean)
);

function redact(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  
  const out: any = Array.isArray(obj) ? [] : {};
  
  for (const k of Object.keys(obj)) {
    if (piiKeys.has(k)) {
      out[k] = "***REDACTED***";
    } else if (obj[k] && typeof obj[k] === "object") {
      out[k] = redact(obj[k]);
    } else {
      out[k] = obj[k];
    }
  }
  
  return out;
}

export function logSampleMw() {
  return (req: Request, res: Response, next: NextFunction) => {
    const take = Math.random() * 100 < pct;
    const t0 = Date.now();
    
    res.on("finish", () => {
      if (!take) return;
      
      const entry = {
        ts: new Date().toISOString(),
        rid: (req as any).rid,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - t0,
        org: req.header("X-Org-Id") || null,
        q: req.query,
        body: redact(req.body || {})
      };
      
      console.log("[ACCESS]", JSON.stringify(entry));
    });
    
    next();
  };
} 