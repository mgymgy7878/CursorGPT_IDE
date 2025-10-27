// re-export event primitives
export type FillEvent = {
  id: string;
  ts: number;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
};

export type OrderEvent = {
  id: string;
  ts: number;
  symbol: string;
  kind: "NEW" | "CANCEL" | "FILL" | "REJECT";
};

export const isFillEvent = (x: unknown): x is FillEvent =>
  !!x && typeof (x as any).price === "number" && typeof (x as any).qty === "number";

import type { CanaryRunMetrics } from "../canary/index.js";
export type CanaryEvent = { id: string; ts: number; kind: "CANARY"; run_id?: string; metrics?: CanaryRunMetrics; };
export type BusEvent = FillEvent | OrderEvent | CanaryEvent;
export const isCanaryEvent = (x: unknown): x is CanaryEvent =>
  !!x && (x as any).kind === "CANARY";

// Vendor-specific event mapping
export function mapVendorFillEvent(vendorEvent: any): FillEvent {
  return {
    id: vendorEvent.id || vendorEvent.orderId,
    symbol: vendorEvent.symbol,
    side: vendorEvent.side,
    price: vendorEvent.price,
    qty: vendorEvent.qty || vendorEvent.quantity,
    ts: vendorEvent.ts || vendorEvent.timestamp || Date.now()
  };
} 