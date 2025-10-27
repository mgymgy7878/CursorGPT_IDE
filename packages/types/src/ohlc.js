export function isBar(x) {
    return !!x &&
        Number.isFinite(x.t) &&
        Number.isFinite(x.o) &&
        Number.isFinite(x.h) &&
        Number.isFinite(x.l) &&
        Number.isFinite(x.c);
}
/** Accepts legacy shapes and arrays; returns canonical Bar or null */
export function normalizeBar(x) {
    if (!x)
        return null;
    if (Array.isArray(x)) {
        const [t, o, h, l, c, v, s] = x;
        const b = { t: Number(t), o: Number(o), h: Number(h), l: Number(l), c: Number(c) };
        if (v != null && Number.isFinite(Number(v)))
            b.v = Number(v);
        if (typeof s === "string" && s.length)
            b.s = s;
        return isBar(b) ? b : null;
    }
    const t = x.t ?? x.time ?? x.ts;
    const o = x.o ?? x.open, h = x.h ?? x.high, l = x.l ?? x.low, c = x.c ?? x.close;
    const v = x.v ?? x.volume, s = x.s ?? x.symbol ?? x.sym ?? x.pair;
    const b = { t: Number(t), o: Number(o), h: Number(h), l: Number(l), c: Number(c) };
    if (v != null && Number.isFinite(Number(v)))
        b.v = Number(v);
    if (typeof s === "string" && s.length)
        b.s = s;
    return isBar(b) ? b : null;
}
/** Converts various time inputs to unix milliseconds (auto-sec→ms) */
export function toEpochMs(input) {
    let n;
    if (input instanceof Date)
        n = input.getTime();
    else if (typeof input === "string") {
        const p = Date.parse(input);
        n = Number.isFinite(p) ? p : Number.NaN;
    }
    else {
        n = input;
    }
    if (!Number.isFinite(n))
        return Number.NaN;
    // Heuristic: values < 1e12 assumed to be seconds
    if (Math.abs(n) < 1e12)
        n = n * 1000;
    return Math.trunc(n);
}
