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