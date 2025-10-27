import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";

export const shadowRouter = Router();
const dir = "runtime/shadow";

shadowRouter.post("/order/shadow", async (req, res, next) => {
  try {
    const tradeMode = process.env.TRADE_MODE || "";
    const live = (tradeMode === "live");
    const liveEnabled = String(process.env.LIVE_ENABLED || "false").toLowerCase() === "true";
    const shadowOn = String(process.env.SHADOW_LIVE_ENABLED || "false").toLowerCase() === "true";
    
    if (!(live && !liveEnabled && shadowOn)) {
      return res.status(403).json({ error: "SHADOW_DISABLED" });
    }
    
    const file = path.join(dir, `orders_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await fs.mkdir(dir, { recursive: true });
    
    const payload = {
      ts: Date.now(),
      req: req.body,
      doNotSend: true
    };
    
    await fs.writeFile(file, JSON.stringify(payload, null, 2));
    
    // Burada isterseniz public/ticker ile simulated fill & latency ekleyin
    res.json({ shadow: true, stored: file });
  } catch (e) {
    next(e);
  }
}); 