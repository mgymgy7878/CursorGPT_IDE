import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center p-8 bg-neutral-950 text-neutral-100">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-neutral-800 flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Sayfa bulunamadı (404)</h1>
          <p className="text-neutral-400">
            Aradığınız sayfa taşınmış veya hiç olmamış olabilir.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors inline-block"
          >
            Dashboard'a Dön
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors inline-block"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
