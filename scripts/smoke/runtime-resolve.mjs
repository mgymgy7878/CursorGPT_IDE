import { normalizeThresholds } from "@spark/types/canary";
import { isFillEvent } from "@spark/types/events";
import * as typesRoot from "@spark/types";

const t = normalizeThresholds({});
const ok = isFillEvent({ id:"1", ts:Date.now(), symbol:"BTCUSDT", side:"BUY", price:1, qty:1 });
if (!ok) throw new Error("isFillEvent guard failed");
if (!typesRoot) throw new Error("root export not resolved");
console.log("OK runtime-resolve", t); 