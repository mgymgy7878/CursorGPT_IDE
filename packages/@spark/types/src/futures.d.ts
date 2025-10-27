export interface Position {
    symbol: string;
    positionAmt: string;
    entryPrice: string;
    leverage: string;
    unrealizedProfit?: string;
}
export interface Fill {
    symbol: string;
    side: 'BUY' | 'SELL';
    qty: string;
    price: string;
    ts: number;
}
export type UserDataStreamEvent = {
    e: 'ACCOUNT_UPDATE';
    E: number;
    a: any;
} | {
    e: 'ORDER_TRADE_UPDATE';
    E: number;
    o: any;
};
//# sourceMappingURL=futures.d.ts.map