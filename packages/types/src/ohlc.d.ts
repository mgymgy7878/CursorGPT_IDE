/** Primitive financial aliases (lightweight; not runtime-branded) */
export type Symbol = string;
export type Price = number;
export type Quantity = number;
/** Canonical OHLC bar (unix ms) */
export interface Bar {
    /** timestamp in unix milliseconds */
    t: number;
    o: Price;
    h: Price;
    l: Price;
    c: Price;
    v?: Quantity;
    /** optional symbol for multi-stream contexts */
    s?: Symbol;
}
export declare function isBar(x: any): x is Bar;
/** Accepts legacy shapes and arrays; returns canonical Bar or null */
export declare function normalizeBar(x: any): Bar | null;
/** Converts various time inputs to unix milliseconds (auto-sec→ms) */
export declare function toEpochMs(input: number | string | Date): number;
