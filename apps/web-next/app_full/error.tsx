'use client';

export default function RootError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-3 text-sm rounded border border-amber-300 bg-amber-50 text-amber-800">
      Uygulama hatası — degrade mod.
      {error?.message && <div className="mt-1 text-xs opacity-75">{error.message} {error?.digest && `· ${error.digest}`}</div>}
      <button onClick={() => reset()} className="mt-2 px-2.5 py-1 text-xs rounded bg-zinc-900 text-white">Yeniden dene</button>
    </div>
  );
} 