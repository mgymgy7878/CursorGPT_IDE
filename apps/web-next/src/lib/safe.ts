export function upper(v: unknown, def = "UNKNOWN") {
  const s = typeof v === "string" ? v : (v as any)?.toString?.();
  return (s ? s : def).toString().toUpperCase();
}

export function asNum(v: unknown, def: number|null = null) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : def;
}

export function asStr(v: unknown, def = "—") {
  return (typeof v === "string" && v.length > 0) ? v : def;
}

export function fmtMs(v: number|null|undefined) {
  return (typeof v === "number" && Number.isFinite(v)) ? `${v} ms` : "—";
}

export function fmtSec(v: number|null|undefined) {
  return (typeof v === "number" && Number.isFinite(v)) ? `${v} s` : "—";
}
