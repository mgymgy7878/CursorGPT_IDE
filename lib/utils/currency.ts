/**
 * Currency formatting utilities for TR locale
 * Tabular numbers for consistent alignment
 */

export interface FormatCurrencyOptions {
  /** Currency code (default: USD) */
  currency?: 'USD' | 'TRY' | 'EUR';
  
  /** Show sign for positive numbers (default: false) */
  showPositiveSign?: boolean;
  
  /** Decimal places (default: 2) */
  decimals?: number;
  
  /** Compact notation for large numbers (default: false) */
  compact?: boolean;
}

/**
 * Format number as Turkish-style currency
 * Example: 12847.50 → "12.847,50 $"
 */
export function formatCurrency(
  value: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = 'USD',
    showPositiveSign = false,
    decimals = 2,
    compact = false,
  } = options;

  const sign = value >= 0 && showPositiveSign ? '+' : '';
  
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
  });

  const formatted = formatter.format(Math.abs(value));
  
  return sign + formatted;
}

/**
 * Format percentage with +/- sign
 * Example: 2.5 → "+2.50%"
 */
export function formatPercent(
  value: number,
  options: { decimals?: number; showSign?: boolean } = {}
): string {
  const { decimals = 2, showSign = true } = options;
  const sign = value >= 0 && showSign ? '+' : '';
  
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M/B suffix
 * Example: 1250000 → "1.25M $"
 */
export function formatCompact(value: number, currency = 'USD'): string {
  return formatCurrency(value, { currency, compact: true });
}

/**
 * Get color class based on value (positive/negative)
 */
export function getValueColorClass(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-danger';
  return 'text-text-muted';
}

/**
 * Format currency with appropriate color
 * Returns { formatted: string, className: string }
 */
export function formatCurrencyWithColor(
  value: number,
  options: FormatCurrencyOptions = {}
): { formatted: string; className: string } {
  return {
    formatted: formatCurrency(value, { ...options, showPositiveSign: true }),
    className: getValueColorClass(value),
  };
}

/**
 * Format percentage with appropriate color
 */
export function formatPercentWithColor(
  value: number,
  options: { decimals?: number } = {}
): { formatted: string; className: string } {
  return {
    formatted: formatPercent(value, { ...options, showSign: true }),
    className: getValueColorClass(value),
  };
}

/**
 * Parse Turkish number format back to number
 * Example: "12.847,50" → 12847.50
 */
export function parseTurkishNumber(value: string): number {
  return parseFloat(
    value
      .replace(/\./g, '') // Remove thousand separators
      .replace(',', '.') // Replace decimal comma with dot
      .replace(/[^\d.-]/g, '') // Remove non-numeric chars except minus
  );
}

