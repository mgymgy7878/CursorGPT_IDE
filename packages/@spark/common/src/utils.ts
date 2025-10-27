export const now = () => Date.now();

export function formatNumber(n: number, digits = 2): string {
  return Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}

let _id = 0;
export function generateId(prefix = "id"): string {
  _id += 1;
  return `${prefix}-${_id}-${now()}`;
}

/** Tailwind class merge-lite */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
} 