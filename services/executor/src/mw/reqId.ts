import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export function reqIdMw() {
  return (req: Request, res: Response, next: NextFunction) => {
    const rid = req.header("X-Request-Id") || randomUUID();
    (req as any).rid = rid;
    res.setHeader("X-Request-Id", rid);
    next();
  };
} 