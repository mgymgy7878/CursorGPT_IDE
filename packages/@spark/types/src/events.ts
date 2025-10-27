// Trading events types
export interface FillEvent {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
  ts: number; // unix ms
}

export interface OrderEvent {
  id: string;
  symbol: string;
  type: "MARKET" | "LIMIT";
  side: "BUY" | "SELL";
  status: "NEW" | "FILLED" | "PARTIAL" | "CANCELED";
  ts: number;
}

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

// Event validation
export function isFillEvent(event: any): event is FillEvent {
  return (
    typeof event === 'object' &&
    typeof event.id === 'string' &&
    typeof event.symbol === 'string' &&
    (event.side === 'BUY' || event.side === 'SELL') &&
    typeof event.price === 'number' &&
    typeof event.qty === 'number' &&
    typeof event.ts === 'number'
  );
} 