export function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export function hasKey<T extends Record<string, unknown>, K extends string>(
  obj: T, key: K
): obj is T & Record<K, unknown> {
  return isRecord(obj) && key in obj;
}

export function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export function toStrOrNull(x: unknown): string | null {
  return typeof x === "string" ? x : null;
}

export function toNumOrNull(x: unknown): number | null {
  const n = Number(x as any);
  return Number.isFinite(n) ? n : null;
}

export function assert(cond: any, msg = "assertion_failed"): asserts cond {
  if (!cond) throw new Error(String(msg));
}

export function assertNonEmptyString(x: unknown, name: string): string {
  if (!isNonEmptyString(x)) throw new Error(`${name} must be non-empty string`);
  return x;
}

export function assertFiniteNumber(x: unknown, name: string): number {
  const n = Number(x as any);
  if (!Number.isFinite(n)) throw new Error(`${name} must be finite number`);
  return n;
} 