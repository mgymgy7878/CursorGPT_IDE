import type { Request, Response, NextFunction } from "express";

export function chaosMw(req: Request, res: Response, next: NextFunction) {
  const p = Number(process.env.CHAOS_HTTP_ERROR_PCT || 0);
  const d = Number(process.env.CHAOS_HTTP_LATENCY_MS || 0);
  
  const maybeFail = () => (Math.random() * 100) < p;
  
  const go = () => {
    if (maybeFail()) {
      return res.status(500).json({ error: "CHAOS_HTTP" });
    }
    next();
  };
  
  if (d > 0) {
    setTimeout(go, d);
  } else {
    go();
  }
} 