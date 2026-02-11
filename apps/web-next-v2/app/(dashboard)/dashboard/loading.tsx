/**
 * Dashboard Loading State
 *
 * Next.js App Router dosya sözleşmesi:
 * - app/(dashboard)/dashboard/loading.tsx loading state için kullanılır
 * - Dashboard yüklenirken bu component gösterilir
 * - Suspense boundary içinde otomatik gösterilir
 *
 * Kaynak: https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function Loading() {
  return (
    <div className="p-6 opacity-70">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
      </div>
      <p className="mt-4">Yükleniyor…</p>
    </div>
  );
}

