/**
 * Locale-aware formatting utilities
 * Provides consistent number, currency, duration, and percentage formatting
 */

export const formatCurrency = (v: number, locale = 'tr-TR', currency = 'USD') => {
  const raw = new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency, 
    currencyDisplay: 'symbol',
    maximumFractionDigits: 2,
  }).format(v)
    .replace(/\u00A0/g, '\u202F'); // NBSP → NNBSP (narrow no-break space)

  // TR locale: move $ to end
  if (locale.startsWith('tr') && /^\$/.test(raw)) {
    const num = raw.replace(/^\$/, '').trim();
    return `${num}\u202F$`; // Narrow no-break space before $
  }
  
  return raw;
};

export const formatNumber = (v: number, locale = 'tr-TR') =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);

export const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms} ms`;
  const s = Math.round(ms / 1000);
  return `${s} sn`;
};

export const formatMs = (ms: number) => `${ms} ms`;
export const formatSec = (s: number) => `${s} sn`;

export const formatPercent = (p: number, locale = 'tr-TR') =>
  new Intl.NumberFormat(locale, { 
    style: 'percent', 
    maximumFractionDigits: 1 
  }).format(p);

/**
 * Replace empty/null/undefined values with user-friendly text
 */
export const emptyText = (v: unknown, fallback = 'Henüz veri yok.') =>
  v === null || v === undefined || v === '—' || v === '' ? fallback : String(v);

