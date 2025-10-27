export interface FillEvent {
    id: string;
    symbol: string;
    side: "BUY" | "SELL";
    price: number;
    qty: number;
    ts: number;
}
export interface OrderEvent {
    id: string;
    symbol: string;
    type: "MARKET" | "LIMIT";
    side: "BUY" | "SELL";
    status: "NEW" | "FILLED" | "PARTIAL" | "CANCELED";
    ts: number;
}
export declare function mapVendorFillEvent(vendorEvent: any): FillEvent;
export declare function isFillEvent(event: any): event is FillEvent;
//# sourceMappingURL=events.d.ts.map