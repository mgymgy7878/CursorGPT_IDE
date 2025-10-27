type TradeSide = "BUY" | "SELL";
export type Trade = {
    ts: number;
    price: number;
    qty: number;
    side: TradeSide;
};
export type EquityPoint = {
    ts: number;
    value: number;
};
/** Girdi tuple/obje karışık olsa da güvenli modele dönüştür. */
export declare const asTrades: (rows: any[]) => Trade[];
export declare const asEquity: (rows: any[]) => EquityPoint[];
export {};
//# sourceMappingURL=backtest.d.ts.map