export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Sayfa bulunamadı (404)</h1>
        <p className="mt-2 text-muted-foreground">
          Aradığınız sayfa taşınmış veya hiç olmamış olabilir.
        </p>
        <a href="/" className="inline-block mt-6 underline">Anasayfa’ya dön</a>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";