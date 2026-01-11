'use client';

import { useEffect } from 'react';

export default function ControlError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Control page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-200">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold">Operasyon Merkezi Yüklenemedi</h2>
        <p className="text-sm text-neutral-400">
          {error.message || 'Beklenmeyen bir hata oluştu'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}

