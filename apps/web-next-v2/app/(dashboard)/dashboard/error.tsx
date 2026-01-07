'use client';

/**
 * Dashboard Error Boundary - Segment Level
 *
 * Next.js App Router dosya sözleşmesi:
 * - app/(dashboard)/dashboard/error.tsx sadece dashboard segment'ini sarar
 * - Dashboard render hatası olduğunda bu component gösterilir
 * - Client component olmalı ('use client')
 *
 * Kaynak: https://nextjs.org/docs/app/api-reference/file-conventions/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-2">Dashboard yüklenemedi</h2>
      <p className="opacity-70 mt-2 mb-4">{error.message || 'Beklenmeyen bir hata oluştu'}</p>
      {error.digest && (
        <p className="text-xs opacity-50 mb-4">Hata ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="mt-3 rounded border border-white/20 px-3 py-1.5 hover:bg-white/10 transition-colors min-h-[24px]"
        aria-label="Tekrar dene"
      >
        Tekrar dene
      </button>
    </div>
  );
}

