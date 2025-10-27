// Vendor-specific event mapping
export function mapVendorFillEvent(vendorEvent) {
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
export function isFillEvent(event) {
    return (typeof event === 'object' &&
        typeof event.id === 'string' &&
        typeof event.symbol === 'string' &&
        (event.side === 'BUY' || event.side === 'SELL') &&
        typeof event.price === 'number' &&
        typeof event.qty === 'number' &&
        typeof event.ts === 'number');
}
//# sourceMappingURL=events.js.map