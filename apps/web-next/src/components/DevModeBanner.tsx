'use client';

import { useTranslation } from '@/hooks/useTranslation';

/**
 * DevModeBanner - Shows when in development/mock mode
 *
 * Displays a banner at the top indicating that the app is running
 * in development mode with mock data instead of real market streams.
 * 
 * Erişilebilirlik: Kontrast ≥ 4.5:1, sticky positioning, clear hierarchy
 */
export default function DevModeBanner() {
  const t = useTranslation();
  const isDev = process.env.NEXT_PUBLIC_ENV === 'dev';
  const isMock = process.env.NEXT_PUBLIC_MOCK === '1';

  if (!isDev && !isMock) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-amber-900/70 backdrop-blur text-amber-100 border-b border-amber-700">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-2">
        <span className="i-lucide-wrench h-4 w-4" aria-hidden="true" />
        <strong>{t('service.dev_mode')}</strong>
        <span className="opacity-80">{t('service.dev_mode_desc')}</span>
      </div>
    </div>
  );
}
