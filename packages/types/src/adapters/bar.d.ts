import type { Bar } from "../ohlc.js";
export type { Bar } from "../ohlc.js";
export { isBar, normalizeBar, toEpochMs } from "../ohlc.js";
/** Legacy → Canonical (throws on invalid) */
export declare function toBar(input: any): Bar;
/** Canonical → Legacy (object shape) */
export declare function fromBar(b: Bar): {
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number | undefined;
    s: string | undefined;
};
