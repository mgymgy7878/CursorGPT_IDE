// Null-safe environment & header helpers (no undefined leakage)
export function envStr(key: string): string | null {
  const v = process.env[key];
  return v ?? null;
}

export function envNum(key: string): number | null {
  const s = envStr(key);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function envBool(key: string): boolean | null {
  const s = envStr(key);
  if (s == null) return null;
  const t = s.trim().toLowerCase();
  if (["1","true","yes","on"].includes(t)) return true;
  if (["0","false","no","off"].includes(t)) return false;
  return null;
}

/** Case-insensitive header getter that returns string|null (never undefined) */
export function headerStr(
  headers: Record<string, string | string[] | undefined>,
  key: string
): string | null {
  const k = key.toLowerCase();
  const raw = headers[k] ?? headers[key] ?? headers[k as keyof typeof headers];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
} 