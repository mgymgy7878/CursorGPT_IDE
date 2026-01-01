/**
 * Format helpers - SABİT locale kullanarak SSR/CSR mismatch'i önler
 *
 * NOT: Locale'yi 'en-US' olarak sabitledik (SSR ve client aynı sonucu üretir).
 * İleride Settings'ten locale seçimi eklenebilir, o zaman useMounted + state ile
 * yönetilir (ilk render'da default, mount sonrası locale okunur).
 */

const DEFAULT_LOCALE = 'en-US';

/**
 * Format number with thousand separators
 * @example formatNumber(124592) => "124,592"
 * @example formatNumber(124592.50) => "124,592.5"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}

/**
 * Format currency (USD by default)
 * @example formatCurrency(124592) => "$124,592.00"
 * @example formatCurrency(124592, 'TRY') => "₺124,592.00"
 *
 * P0 FIX: Guard against locale strings being passed as currency.
 * Currency must be ISO 4217 (USD, TRY, EUR, etc.), not locale (tr-TR, en-US).
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  // P0 FIX: Guard - if currency param looks like locale (contains '-'), map to currency
  let safeCurrency = currency;
  if (currency.includes('-')) {
    // Locale->Currency mapping
    const localeToCurrency: Record<string, string> = {
      'tr-TR': 'TRY',
      'en-US': 'USD',
      'en-GB': 'GBP',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
    };
    safeCurrency = localeToCurrency[currency] || 'USD';
  }

  // Validate currency code (ISO 4217: 3 uppercase letters)
  if (!/^[A-Z]{3}$/.test(safeCurrency)) {
    safeCurrency = 'USD'; // Fallback to USD
  }

  try {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(num);
  } catch (error) {
    // Fallback: if Intl.NumberFormat fails, use decimal format
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(num);
  }
}

/**
 * Format price USD (PATCH Y - Figma parity: smart decimals)
 * @example formatPriceUsd(43245) => "$43,245" (integer, no .00)
 * @example formatPriceUsd(0.6142) => "$0.6142" (<1, 4 decimals)
 * @example formatPriceUsd(98.50) => "$98.50" (<100, 2 decimals)
 * @example formatPriceUsd(42150) => "$42,150" (>=100, 0 decimals)
 *
 * Figma parity: büyük fiyatlar .00'sız, küçük fiyatlar anlamlı hassasiyetle
 */
export function formatPriceUsd(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  // PATCH Y: Kademeli decimal logic (Figma parity)
  let minDecimals = 0;
  let maxDecimals = 0;

  if (abs < 1) {
    // <1: 4 decimals (örn 0.6142)
    minDecimals = 4;
    maxDecimals = 4;
  } else if (abs < 100) {
    // <100: 2 decimals (örn 98.50)
    minDecimals = 2;
    maxDecimals = 2;
  } else {
    // >=100: 0 decimals (örn 43,245 veya 42,150)
    minDecimals = 0;
    maxDecimals = 0;
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num);
}

/**
 * Format percentage
 * @example formatPercent(1.2) => "1.2%"
 * @example formatPercent(0.012) => "1.2%" (auto: multiply by 100 if < 1)
 */
export function formatPercent(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions & { auto?: boolean }
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  // Auto: if value < 1, assume it's a decimal (0.012 = 1.2%)
  const finalValue = options?.auto !== false && Math.abs(num) < 1 ? num * 100 : num;
  const { auto, ...intlOptions } = options || {};

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    ...intlOptions,
  }).format(finalValue / 100);
}

/**
 * Format date (ISO string or Date object) - SABİT format + timezone
 * @example formatDate(new Date()) => "12/18/2025, 9:14 PM"
 *
 * NOT: timeZone sabitlendi (Europe/Istanbul) - SSR/CSR aynı sonucu üretir.
 * Server UTC olsa bile, client'ın TZ'i farklı olsa bile, sabit TZ ile format aynıdır.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '—';
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  if (isNaN(dateObj.getTime())) return '—';

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul', // SABİT timezone - SSR/CSR mismatch'i önler
    ...options, // options içinde timeZone varsa override eder
  }).format(dateObj);
}

/**
 * Format time only
 * @example formatTime(new Date()) => "9:14 PM"
 *
 * NOT: timeZone sabitlendi (Europe/Istanbul) - SSR/CSR aynı sonucu üretir.
 */
export function formatTime(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '—';
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  if (isNaN(dateObj.getTime())) return '—';

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul', // SABİT timezone - SSR/CSR mismatch'i önler
    ...options, // options içinde timeZone varsa override eder
  }).format(dateObj);
}

/**
 * Format compact USD (PATCH V - Figma parity)
 * @example formatCompactUsd(2840000000) => "$28.4B"
 * @example formatCompactUsd(1800000000) => "$1.8B"
 * @example formatCompactUsd(845000000) => "$845M"
 * @example formatCompactUsd(1250000) => "$1.25M"
 */
export function formatCompactUsd(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  // PATCH W: Remove .0 suffix for cleaner display (Figma parity)
  const formatValue = (val: number, decimals: number) => {
    const formatted = val.toFixed(decimals);
    return formatted.replace(/\.0+$/, ''); // Remove trailing .0
  };

  if (abs >= 1_000_000_000) {
    return `${sign}$${formatValue(abs / 1_000_000_000, 1)}B`;
  } else if (abs >= 1_000_000) {
    return `${sign}$${formatValue(abs / 1_000_000, 1)}M`;
  } else if (abs >= 1_000) {
    return `${sign}$${formatValue(abs / 1_000, 1)}K`;
  } else {
    return `${sign}$${abs.toFixed(2)}`;
  }
}

/**
 * Format signed USD change (PATCH W fix - preserve negative sign)
 * @example formatSignedUsd(1024.50) => "+$1,024.50"
 * @example formatSignedUsd(-450.25) => "-$450.25"
 */
export function formatSignedUsd(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  // PATCH W fix: Preserve negative sign (don't use Math.abs)
  const sign = num >= 0 ? '+' : '-';
  const absValue = Math.abs(num);
  // formatCurrency always returns positive, so we prepend the sign
  return `${sign}${formatCurrency(absValue, 'USD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format signed percentage (PATCH W fix - preserve negative sign)
 * @example formatSignedPct(2.4, { input: 'pct' }) => "+2.4%"
 * @example formatSignedPct(-0.5, { input: 'pct' }) => "-0.5%"
 * @example formatSignedPct(0.024, { input: 'ratio' }) => "+2.4%"
 *
 * @param value - Percentage value (pct-point if input='pct', decimal ratio if input='ratio')
 * @param options - { input: 'pct' | 'ratio' } - 'pct' for percentage points (1.2 = 1.2%), 'ratio' for decimal (0.012 = 1.2%)
 */
export function formatSignedPct(
  value: number | string | null | undefined,
  options?: { input?: 'pct' | 'ratio' }
): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  // PATCH W: Explicit input type - no heuristics
  const inputType = options?.input ?? 'pct';
  const finalValue = inputType === 'ratio' ? num * 100 : num;
  // PATCH W fix: Preserve negative sign
  const sign = finalValue >= 0 ? '+' : '-';

  return `${sign}${Math.abs(finalValue).toFixed(1)}%`;
}
