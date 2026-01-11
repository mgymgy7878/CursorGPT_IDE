import Link from 'next/link';

/**
 * Not Found Page - 404
 *
 * Next.js App Router dosya sözleşmesi:
 * - app/not-found.tsx 404 sayfası için kullanılır
 * - Route bulunamadığında bu component gösterilir
 *
 * Kaynak: https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  return (
    <div className="p-10">
      <h1 className="text-xl font-semibold mb-2">Sayfa bulunamadı (404)</h1>
      <p className="opacity-70 mt-2 mb-4">
        Aradığınız sayfa taşınmış veya hiç olmamış olabilir.
      </p>
      <Link
        href="/dashboard"
        className="inline-block rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10 transition-colors min-h-[24px]"
      >
        Anasayfaya dön
      </Link>
    </div>
  );
}

