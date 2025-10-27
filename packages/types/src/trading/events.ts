export type Side = "BUY" | "SELL";
export interface FillEvent {
  id: string;
  symbol: string;
  side: Side;
  price: number;
  qty: number;
  ts: number;             // epoch ms
  orderId?: string;
}
export function isFillEvent(x: any): x is FillEvent {
  return !!x && typeof x.symbol==="string" && typeof x.price==="number" && typeof x.qty==="number";
}
export function mapVendorFillEvent(v: any): FillEvent {
  return {
    id: String(v?.id ?? v?.t ?? cryptoRandomId()),
    symbol: String(v?.s ?? v?.symbol ?? "UNKNOWN"),
    side: (String(v?.S ?? v?.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY"),
    price: Number(v?.p ?? v?.price ?? 0),
    qty: Number(v?.q ?? v?.qty ?? v?.quantity ?? 0),
    ts: Number(v?.T ?? v?.ts ?? Date.now()),
    orderId: v?.orderId ? String(v.orderId) : undefined
  };
}
function cryptoRandomId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
