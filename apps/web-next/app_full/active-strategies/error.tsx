'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Bir şey ters gitti</h2>
      <pre className="text-xs opacity-70 whitespace-pre-wrap">{error.message}</pre>
      <button onClick={() => reset()} className="mt-2 px-3 py-1 rounded border hover:bg-muted">Tekrar dene</button>
    </div>
  );
}


