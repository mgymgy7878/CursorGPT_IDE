/* eslint-disable @typescript-eslint/no-explicit-any */

import { getEffectiveKillSwitch, readOverride } from "../lib/policy.js";

export function registerCanaryPolicyRoute(app: any) {
  const routePath = "/canary/policy";
  const handler = async (_req: any, res: any) => {
    const eff = getEffectiveKillSwitch();
    const minNotional = Number(process.env.MIN_NOTIONAL ?? 5);
    const priceHint = Number(process.env.PRICE_HINT_USDT ?? 60000);
    const symbolDefault = process.env.LIVE_SYMBOL ?? "BTCUSDT";
    const tinyQtyDefault = Number(process.env.LIVE_TINY_QTY ?? 0.00005);

    const body = {
      killSwitch: eff.killSwitch,
      minNotional,
      priceHint,
      symbolDefault,
      tinyQtyDefault,
      confirmRequired: true,
      testnetOnly: true,
      source: eff.source,
      override: eff.override ?? readOverride(),
    };
    if (typeof res?.json === "function") return res.json(body);
    return body;
  };

  if (typeof app?.get === "function") { app.get(routePath, handler); return; }
  if (typeof app?.route === "function") { app.route({ method:"GET", url: routePath, handler }); return; }
  throw new Error("registerCanaryPolicyRoute: Unsupported app instance");
} 