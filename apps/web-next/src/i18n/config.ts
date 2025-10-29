export const locales = ['tr', 'en'] as const;
export const defaultLocale = 'tr';

export type Locale = (typeof locales)[number];

