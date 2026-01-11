/**
 * Backtest metrik formatlama helper'ları
 * null/undefined/NaN → "—" fallback ile güvenli formatlama
 */

/**
 * Percent değerini normalize et (0-1 arası veya null/undefined)
 * @param value - Percent değeri (0-1 arası veya null/undefined)
 * @returns Normalize edilmiş değer (0-1 arası) veya null
 */
export const normalizePercent = (value: number | null | undefined): number | null => {
  if (value == null || isNaN(value)) return null;
  // Eğer 0-1 arası değilse, 100'e böl (örn: 68 → 0.68)
  if (value > 1) return value / 100;
  return value;
};

/**
 * Percent değerini formatla (normalize + fallback)
 * @param value - Percent değeri
 * @returns Formatlanmış string (örn: "68.00%") veya "—"
 */
export const formatBacktestPercent = (value: number | null | undefined): string => {
  const normalized = normalizePercent(value);
  if (normalized == null) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
};

/**
 * Sayısal değeri formatla (fallback ile)
 * @param value - Sayısal değer
 * @returns Formatlanmış string (örn: "1.85") veya "—"
 */
export const formatBacktestNumber = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

