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
