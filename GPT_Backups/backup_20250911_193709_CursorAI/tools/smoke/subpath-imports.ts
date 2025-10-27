import { isFillEvent, type FillEvent, normalizeThresholds, normalizeCanaryResponse, type CanaryRunResponse } from "@spark/types";
import type { CanaryThresholds } from "@spark/types";
import { isFillEvent as isFillEventSub } from "@spark/types";

const t: CanaryThresholds = normalizeThresholds({});
const e: FillEvent = { id: "1", ts: Date.now(), symbol: "BTCUSDT", side: "BUY", price: 1, qty: 1 };
if (!isFillEvent(e) || !isFillEventSub(e)) throw new Error("subpath import/type guard failed");

const cr: CanaryRunResponse = normalizeCanaryResponse({ /* minimal input */ } as any);
console.log("OK root-import normalizeCanaryResponse", !!cr);

console.log("OK subpath-imports", t); 