'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <div className="text-rose-400 font-semibold mb-2">Bir şeyler ters gitti.</div>
      <div className="text-xs text-zinc-400 mb-4">{error?.message ?? 'Unknown error'}</div>
      <button
        className="px-3 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800"
        onClick={() => reset()}
      >
        Tekrar dene
      </button>
    </div>
  );
} 