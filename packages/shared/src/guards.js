export function isRecord(x) {
    return !!x && typeof x === "object" && !Array.isArray(x);
}
export function hasKey(obj, key) {
    return isRecord(obj) && key in obj;
}
export function isNonEmptyString(x) {
    return typeof x === "string" && x.trim().length > 0;
}
export function toStrOrNull(x) {
    return typeof x === "string" ? x : null;
}
export function toNumOrNull(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
}
export function assert(cond, msg = "assertion_failed") {
    if (!cond)
        throw new Error(String(msg));
}
export function assertNonEmptyString(x, name) {
    if (!isNonEmptyString(x))
        throw new Error(`${name} must be non-empty string`);
    return x;
}
export function assertFiniteNumber(x, name) {
    const n = Number(x);
    if (!Number.isFinite(n))
        throw new Error(`${name} must be finite number`);
    return n;
}
