/**
 * Çeviri hook'u - React component'lerde i18n kullanımı
 */

import { t, getCurrentLocale } from '@/lib/i18n';

/**
 * Çeviri hook'u
 * @param namespace - İsteğe bağlı namespace (şimdilik kullanılmıyor)
 * @returns Çeviri fonksiyonu ve mevcut dil
 */
export const useTranslation = (namespace?: string) => {
  return {
    t,
    locale: getCurrentLocale(),
  };
};

/**
 * Basit çeviri hook'u (namespace olmadan)
 */
export const useT = () => t;
