import { normalizeBar } from "../ohlc.js";
export { isBar, normalizeBar, toEpochMs } from "../ohlc.js";
/** Legacy → Canonical (throws on invalid) */
export function toBar(input) {
    const b = normalizeBar(input);
    if (!b)
        throw new Error("toBar: invalid bar input");
    return b;
}
/** Canonical → Legacy (object shape) */
export function fromBar(b) {
    return { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v, s: b.s };
}
