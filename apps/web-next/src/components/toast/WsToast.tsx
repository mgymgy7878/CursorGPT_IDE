'use client';

import { useEffect, useState } from 'react';
import { useWsRetry } from '@/hooks/useWsRetry';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * WsToast - Non-blocking WebSocket disconnection notification
 *
 * Shows toast when WS goes down, with manual retry option
 * Auto-retries with exponential backoff
 * Dismissible by user
 */
export default function WsToast() {
  const { isDown, isDegraded, retryState, retryNow } = useWsRetry();
  const [dismissed, setDismissed] = useState(false);

  // Show toast when WS is down/degraded and not dismissed
  const showToast = (isDown || isDegraded) && !dismissed;

  // Reset dismissed state when WS recovers
  useEffect(() => {
    if (!isDown && !isDegraded) {
      setDismissed(false);
    }
  }, [isDown, isDegraded]);

  if (!showToast) return null;

  return (
    <div
      className="fixed bottom-20 right-6 z-50 max-w-sm bg-zinc-900 border border-red-500/30 rounded-xl shadow-2xl p-4"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <WifiOff className="size-5 text-red-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-neutral-100 mb-1">
            Canlı veri bağlantısı koptu
          </div>
          <div className="text-sm text-neutral-400 mb-3">
            {retryState.isRetrying
              ? "Tekrar bağlanılıyor..."
              : `${Math.ceil(retryState.nextRetryIn / 1000)} saniye içinde otomatik deneme (${retryState.attempt + 1}. deneme)`
            }
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={retryNow}
              disabled={retryState.isRetrying}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`size-3.5 ${retryState.isRetrying ? 'animate-spin' : ''}`} />
              Şimdi Dene
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

