/**
 * UI utility fonksiyonları - CSS class birleştirme ve yardımcılar
 */

/**
 * CSS class'larını birleştirir
 * @param classes - Birleştirilecek class'lar
 * @returns Birleştirilmiş class string'i
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Koşullu class uygulama
 * @param condition - Koşul
 * @param trueClass - Koşul true ise uygulanacak class
 * @param falseClass - Koşul false ise uygulanacak class
 * @returns Uygulanacak class
 */
export const conditionalClass = (
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string => {
  return condition ? trueClass : falseClass;
};

/**
 * Durum bazlı renk class'ları
 */
export const statusColors = {
  success: 'text-green-400 bg-green-500/20 border-green-500/30',
  error: 'text-red-400 bg-red-500/20 border-red-500/30',
  warning: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  info: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  unknown: 'text-zinc-400 bg-zinc-500/20 border-zinc-500/30',
} as const;

/**
 * Durum bazlı dot renkleri
 */
export const dotColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  unknown: 'bg-zinc-400 animate-pulse',
} as const;

/**
 * Durum tipi
 */
export type Status = 'success' | 'error' | 'warning' | 'info' | 'unknown';

/**
 * Durum rengini al
 * @param status - Durum
 * @returns Renk class'ları
 */
export const getStatusColor = (status: Status): string => {
  return statusColors[status];
};

/**
 * Dot rengini al
 * @param status - Durum
 * @returns Dot renk class'ı
 */
export const getDotColor = (status: Status): string => {
  return dotColors[status];
};

/**
 * Sayısal değer için renk belirleme
 * @param value - Değer
 * @param positive - Pozitif değer için renk
 * @param negative - Negatif değer için renk
 * @param neutral - Nötr değer için renk
 * @returns Renk class'ı
 */
export const getValueColor = (
  value: number,
  positive: string = 'text-green-400',
  negative: string = 'text-red-400',
  neutral: string = 'text-zinc-400'
): string => {
  if (value > 0) return positive;
  if (value < 0) return negative;
  return neutral;
};

/**
 * Yüzde değeri için renk belirleme
 * @param percentage - Yüzde değeri (0-1 arası)
 * @returns Renk class'ı
 */
export const getPercentageColor = (percentage: number): string => {
  return getValueColor(percentage, 'text-green-400', 'text-red-400', 'text-zinc-400');
};

/**
 * Tablo sütun hizalaması
 */
export const tableAlignments = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  numeric: 'text-right tabular-nums',
} as const;

/**
 * Grid layout yardımcıları
 */
export const gridLayouts = {
  markets: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  table: 'grid grid-cols-12 gap-4',
} as const;

/**
 * Spacing yardımcıları
 */
export const spacing = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
} as const;

/**
 * Border radius yardımcıları
 */
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

/**
 * Shadow yardımcıları
 */
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const;
