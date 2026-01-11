/**
 * Gate C: Live Debug Badge
 *
 * Shows activeStreams, state, requestId, events, tokens/chars, lastEventTs
 * Only visible when ?debugLive=1 or localStorage flag set
 *
 * PATCH: Added "Start Mock Stream" button for Gate C testing
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLiveSession } from '@/lib/live-react/useLiveSession';
import { cn } from '@/lib/utils';

// Global event emitter for debug trigger
// CopilotDock listens to this to start mock stream
const DEBUG_TRIGGER_EVENT = 'spark:debug:mock-stream';

export function triggerMockStream() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEBUG_TRIGGER_EVENT, { detail: { message: 'debug mock stream' } }));
  }
}

// Hook for CopilotDock to listen to debug trigger
export function useDebugTrigger(onTrigger: (message: string) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      onTrigger(detail?.message || 'debug mock stream');
    };
    window.addEventListener(DEBUG_TRIGGER_EVENT, handler);
    return () => window.removeEventListener(DEBUG_TRIGGER_EVENT, handler);
  }, [onTrigger]);
}

export function LiveDebugBadge() {
  const [enabled, setEnabled] = useState(false);
  const [hasMockFlag, setHasMockFlag] = useState(false);
  const [lastTriggerAt, setLastTriggerAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const { state, telemetry, requestId, start } = useLiveSession();

  // Check for debug flag
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check URL parameter
    const params = new URLSearchParams(window.location.search);
    const urlFlag = params.get('debugLive') === '1';
    const mockFlag = params.get('mock') === '1';

    // Check localStorage
    const storageFlag = localStorage.getItem('debugLive') === 'true';

    setEnabled(urlFlag || storageFlag);
    setHasMockFlag(mockFlag);
  }, []);

  // Handle mock stream trigger
  const handleStartMockStream = useCallback(() => {
    // Gate C: Prevent double request - check if stream is already active
    if (state !== 'idle') {
      const currentState = state;
      setLastError(`Stream already ${currentState}. Wait for completion.`);
      console.warn('[DEBUG] Mock stream blocked: stream already active', { currentState });
      return;
    }

    console.debug('[DEBUG] Start Mock Stream clicked');
    setLastTriggerAt(Date.now());
    setLastError(null);

    if (!hasMockFlag) {
      setLastError('mock=1 yok → 401 olabilir');
    }

    // Gate C: Only use event emitter path (CopilotDock handles actual stream)
    // Removed direct fetch to prevent double request
    triggerMockStream();
  }, [hasMockFlag, state]);

  if (!enabled) return null;

  const activeStreams = state !== 'idle' ? 1 : 0;
  const chars = telemetry.tokensReceived * 4; // Rough estimate
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-neutral-900/95 border border-neutral-700 rounded-lg p-3 text-xs font-mono shadow-lg max-w-[280px]">
      <div className="text-neutral-400 mb-2 font-semibold">Gate C Debug</div>

      {/* Debug Trigger Button - Dev only */}
      {isDev && (
        <div className="mb-3 pb-2 border-b border-neutral-700">
          <button
            onClick={handleStartMockStream}
            disabled={state !== 'idle'}
            className={cn(
              "w-full px-2 py-1.5 rounded text-[11px] font-medium transition-colors",
              state !== 'idle'
                ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                : hasMockFlag
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-yellow-600 hover:bg-yellow-700 text-white"
            )}
            title={state !== 'idle' ? `Stream is ${state}. Wait for completion.` : undefined}
          >
            🚀 Start Mock Stream
          </button>
          {!hasMockFlag && (
            <div className="mt-1 text-[9px] text-yellow-400">
              ⚠️ mock=1 yok → real SSE 401 olabilir
            </div>
          )}
          {lastTriggerAt && (
            <div className="mt-1 text-[9px] text-neutral-500">
              Last trigger: {((Date.now() - lastTriggerAt) / 1000).toFixed(1)}s ago
            </div>
          )}
          {lastError && (
            <div className="mt-1 text-[9px] text-red-400">
              Error: {lastError}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1 text-neutral-300">
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">Streams:</span>
          <span className={cn(
            "font-semibold",
            activeStreams === 1 ? "text-green-400" : "text-neutral-500"
          )}>
            {activeStreams}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">State:</span>
          <span className={cn(
            "font-semibold",
            state === 'streaming' ? "text-green-400" :
            state === 'idle' ? "text-neutral-500" :
            state === 'error' ? "text-red-400" :
            state === 'aborted' ? "text-orange-400" :
            "text-yellow-400"
          )}>
            {state}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">RequestId:</span>
          <span className="text-neutral-300 font-mono text-[10px] truncate max-w-[120px]">
            {requestId || '-'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">Events:</span>
          <span className="text-neutral-300">{telemetry.eventsReceived}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">Tokens:</span>
          <span className="text-neutral-300">{telemetry.tokensReceived}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">Chars:</span>
          <span className="text-neutral-300">{chars}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">Duration:</span>
          <span className="text-neutral-300">
            {(telemetry.streamDurationMs / 1000).toFixed(1)}s
          </span>
        </div>
        {telemetry.lastEventTs && (
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">Last Event:</span>
            <span className="text-neutral-300">
              {((Date.now() - telemetry.lastEventTs) / 1000).toFixed(1)}s ago
            </span>
          </div>
        )}

        {/* Extended telemetry */}
        {telemetry.lastStartUrl && (
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">URL:</span>
            <span className="text-neutral-300 text-[9px] truncate max-w-[120px]" title={telemetry.lastStartUrl}>
              {telemetry.lastStartUrl.replace('/api/copilot/', '...')}
            </span>
          </div>
        )}
        {telemetry.lastStartAt && (
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">Started:</span>
            <span className="text-neutral-300">
              {((Date.now() - telemetry.lastStartAt) / 1000).toFixed(1)}s ago
            </span>
          </div>
        )}
        {telemetry.startAttempts > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">Attempts:</span>
            <span className="text-neutral-300">{telemetry.startAttempts}</span>
          </div>
        )}
        {telemetry.lastError && (
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">Error:</span>
            <span className="text-red-400 text-[9px] truncate max-w-[120px]" title={telemetry.lastError}>
              {telemetry.lastError}
            </span>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-neutral-700 text-[10px] text-neutral-500">
        ?debugLive=1 or localStorage.debugLive=true
      </div>
    </div>
  );
}

