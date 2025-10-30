/**
 * Tutarlı sayı, para ve süre formatlaması için utility fonksiyonları
 * Tüm uygulama genelinde tek format standardı sağlar
 */

export type Currency = 'USD' | 'TRY';
export type Locale = 'tr-TR' | 'en-US';

/**
 * Para birimi formatlaması
 * @param value - Formatlanacak değer
 * @param currency - Para birimi (USD/TRY)
 * @param locale - Yerel ayar
 * @returns Formatlanmış para birimi string'i
 */
export const fmtMoney = (
  value: number, 
  currency: Currency = 'USD', 
  locale: Locale = 'tr-TR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Yüzde formatlaması
 * @param value - 0-1 arası değer (örn: 0.023 = %2.3)
 * @param locale - Yerel ayar
 * @returns Formatlanmış yüzde string'i
 */
export const fmtPct = (value: number, locale: Locale = 'tr-TR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Tam sayı formatlaması
 * @param value - Formatlanacak değer
 * @param locale - Yerel ayar
 * @returns Formatlanmış tam sayı string'i
 */
export const fmtInt = (value: number, locale: Locale = 'tr-TR'): string => {
  return new Intl.NumberFormat(locale).format(value);
};

/**
 * Süre formatlaması (milisaniye → okunabilir format)
 * @param ms - Milisaniye cinsinden süre
 * @returns Formatlanmış süre string'i (örn: "2.5 sn", "1 dk 30 sn")
 */
export const fmtDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms} ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds} sn`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes} dk ${remainingSeconds} sn`
      : `${minutes} dk`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours} sa ${remainingMinutes} dk`
    : `${hours} sa`;
};

/**
 * Büyük sayılar için kısaltma (1K, 1M, 1B)
 * @param value - Formatlanacak değer
 * @param locale - Yerel ayar
 * @returns Kısaltılmış sayı string'i
 */
export const fmtCompact = (value: number, locale: Locale = 'tr-TR'): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Tarih formatlaması
 * @param date - Formatlanacak tarih
 * @param locale - Yerel ayar
 * @returns Formatlanmış tarih string'i
 */
export const fmtDate = (date: Date, locale: Locale = 'tr-TR'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};