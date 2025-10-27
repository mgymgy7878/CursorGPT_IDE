import type { RH, ApiRes } from "@spark/common";
import type { Request, Response } from "express";

export function diagHandler(_req: Request, res: Response) {
  res.json({
    port: Number(process.env.PORT || 4001),
    liveTrading: Number(process.env.LIVE_TRADING ?? "0"),
    shadowMode: Number(process.env.SHADOW_MODE ?? "1"),
    hasToken: Boolean(process.env.EXECUTOR_TOKEN),
    hasKeys: Boolean(process.env.BINANCE_MAINNET_API_KEY && process.env.BINANCE_MAINNET_API_SECRET),
    whitelist: (process.env.TRADE_WHITELIST || "").split(",").filter(Boolean),
    tradeWindow: process.env.TRADE_WINDOW || "N-A",
  });
} 