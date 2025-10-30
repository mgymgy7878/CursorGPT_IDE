/**
 * Format utilities - P0.2 unit standardization
 */

export type TimeUnit = 'ms' | 's';

/**
 * Format duration with unit - P0.2 Fix
 *
 * @param value - Duration value
 * @param unit - 'ms' for latency, 's' for staleness/threshold
 * @returns Formatted string (e.g., "58 ms", "30 sn")
 */
export function formatDuration(value: number, unit: TimeUnit = 'ms'): string {
  return unit === 'ms' ? `${value} ms` : `${value} sn`;
}

/**
 * Format currency in Turkish locale
 *
 * @param value - Amount
 * @param locale - Locale (default: tr-TR)
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, locale = 'tr-TR', currency = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format number with locale-specific separators
 *
 * @param value - Number to format
 * @param locale - Locale (default: tr-TR)
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale = 'tr-TR', options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format percentage
 *
 * @param value - Decimal value (e.g., 0.025 for 2.5%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "+2.5%")
 */
export function formatPercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

/**
 * Check if value meets threshold with status
 *
 * @param value - Current value
 * @param target - Target/threshold value
 * @param reverseLogic - true if lower is better (latency), false if higher is better
 * @returns Status: 'good' | 'warn' | 'bad'
 */
export function thresholdStatus(
  value: number,
  target: number,
  reverseLogic = true
): 'good' | 'warn' | 'bad' {
  const ratio = value / target;

  if (reverseLogic) {
    // Lower is better (latency)
    if (ratio < 0.5) return 'good';
    if (ratio < 1.0) return 'warn';
    return 'bad';
  } else {
    // Higher is better (uptime, availability)
    if (ratio > 0.9) return 'good';
    if (ratio > 0.7) return 'warn';
    return 'bad';
  }
}
