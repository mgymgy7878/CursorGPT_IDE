'use client';

/**
 * DevModeBanner - Shows when in development/mock mode
 *
 * Displays a subtle banner at the top indicating that the app is running
 * in development mode with mock data instead of real market streams.
 */
export default function DevModeBanner() {
  const isDev = process.env.NEXT_PUBLIC_ENV === 'dev';
  const isMock = process.env.NEXT_PUBLIC_MOCK === '1';

  if (!isDev && !isMock) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
      <div className="text-sm text-amber-400 font-medium">
        🚧 Dev/Mock aktif — gerçek tick akışı yok
      </div>
    </div>
  );
}
