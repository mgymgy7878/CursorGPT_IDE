'use client';

/**
 * Global Error Boundary - Root Level
 *
 * Next.js App Router dosya sözleşmesi:
 * - app/global-error.tsx tüm uygulamayı sarar
 * - Render hatası olduğunda bu component gösterilir
 * - Client component olmalı ('use client')
 *
 * Kaynak: https://nextjs.org/docs/app/api-reference/file-conventions/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen grid place-items-center p-6 bg-neutral-950 text-neutral-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Bir şeyler ters gitti</h2>
          <p className="opacity-70 mt-2 mb-4">{error.message || 'Beklenmeyen bir hata oluştu'}</p>
          {error.digest && (
            <p className="text-xs opacity-50 mb-4">Hata ID: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            className="mt-4 rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10 transition-colors min-h-[24px]"
            aria-label="Sayfayı yenile"
          >
            Yenile
          </button>
        </div>
      </body>
    </html>
  );
}

