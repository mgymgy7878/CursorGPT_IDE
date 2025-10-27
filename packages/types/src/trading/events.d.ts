export type Side = "BUY" | "SELL";
export interface FillEvent {
    id: string;
    symbol: string;
    side: Side;
    price: number;
    qty: number;
    ts: number;
    orderId?: string;
}
export declare function isFillEvent(x: any): x is FillEvent;
export declare function mapVendorFillEvent(v: any): FillEvent;
