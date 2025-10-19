"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // Dev'de kök hatayı console'a yaz, prod'da ErrorSink zaten sınırlar
    // eslint-disable-next-line no-console
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-2xl w-full rounded-2xl border border-neutral-800 p-5">
          <h2 className="text-lg font-semibold mb-2">Bir şeyler ters gitti</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Sayfayı yenileyebilir veya hatayı sıfırlayabilirsiniz.
          </p>
          <pre className="text-xs bg-neutral-900 rounded-md p-3 overflow-auto mb-4">
{String(error?.message ?? "Unknown error")}
{error?.digest ? `\n#${error.digest}` : ""}
          </pre>
          <button onClick={() => reset()} className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500">
            Yeniden dene
          </button>
        </div>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
