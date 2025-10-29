// Simple i18n hook for client components
// Later can be replaced with next-intl or similar

import { defaultLocale } from './config';

// Simple message loader
const messages: Record<string, any> = {
  tr: {},
  en: {},
};

// Load messages dynamically (in real app, use next-intl)
export function useTranslation(namespace: string = 'common') {
  const locale = defaultLocale; // For now, always TR
  
  return (key: string): string => {
    try {
      // Try to load from messages
      if (!messages[locale][namespace]) {
        // Lazy load (in production, this should be static)
        const commonTr = require('../../messages/tr/common.json');
        messages.tr.common = commonTr;
        
        const commonEn = require('../../messages/en/common.json');
        messages.en.common = commonEn;
      }
      
      return messages[locale][namespace]?.[key] || key;
    } catch {
      return key; // Fallback to key
    }
  };
}

// Simple translation function for server components
export function t(key: string, locale: string = defaultLocale): string {
  try {
    const commonTr = require('../../messages/tr/common.json');
    const commonEn = require('../../messages/en/common.json');
    
    const messages = locale === 'tr' ? commonTr : commonEn;
    return messages[key] || key;
  } catch {
    return key;
  }
}

