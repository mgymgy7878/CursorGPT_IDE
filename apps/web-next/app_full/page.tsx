import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
      <div className="w-full max-w-2xl rounded-2xl border bg-white shadow-sm p-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">
          Spark Trading Platform
        </h1>

        <p className="text-neutral-600 mb-6">
          Hızlı erişim için aşağıdaki kısayolu kullanın. Stage rollout sürecinde{" "}
          <code>NEXT_PUBLIC_UI_FUTURES_V22</code> bayrağı ve RBAC kuralları geçerlidir.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/ops"
            aria-label="Operasyon Paneli"
            className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium bg-black text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/30"
          >
            Operasyon Paneli
          </Link>
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Doğru rota: <code>/ops</code>. Kapılar kapalıyken emirlerde{" "}
          <code>403 + confirm_required:true</code> beklenir.
        </p>
      </div>
    </main>
  );
}
