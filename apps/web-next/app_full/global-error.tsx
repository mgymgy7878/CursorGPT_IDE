'use client';
export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html><body className="p-4">
      <div className="text-sm p-3 rounded border border-amber-300 bg-amber-50 text-amber-800">
        Global hata — degrade mod.
        {error?.message && <div className="mt-1 text-xs opacity-75">{error.message} {error?.digest && `· ${error.digest}`}</div>}
        <button onClick={() => reset()} className="mt-2 px-2.5 py-1 text-xs rounded bg-zinc-900 text-white">Yeniden dene</button>
      </div>
    </body></html>
  );
} 