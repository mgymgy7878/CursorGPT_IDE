/**
 * Gate C: Live Session Manager
 *
 * Tek aktif stream kuralı: aynı anda Dock + StatusBar açık olsa bile 1 SSE bağlantısı.
 * Session state: idle | connecting | streaming | done | error | aborted
 * AbortController yönetimi: "cancel -> idle" deterministik, AbortError'da error event üretme (Gate B ile uyum).
 * requestId üretimi + store: her stream requestId taşır, UI tooltip/log için saklanır.
 *
 * PATCH: Zustand global store ile state paylaşımı (LiveDebugBadge + CopilotDock sync)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { create } from 'zustand';

export type LiveSessionState = 'idle' | 'connecting' | 'streaming' | 'done' | 'error' | 'aborted';

export interface LiveSessionConfig {
  url: string;
  method?: 'GET' | 'POST';
  body?: any;
  headers?: Record<string, string>;
  maxTokens?: number;
  maxChars?: number;
  maxDuration?: number; // milliseconds
}

/**
 * Get dev-only limit overrides from URL params (for Gate C testing)
 * Format: ?debugLive=1&liveMaxDurationMs=5000&liveMaxTokens=100&liveMaxChars=1000
 */
function getDevLimitOverrides(): Partial<Pick<LiveSessionConfig, 'maxTokens' | 'maxChars' | 'maxDuration'>> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  if (params.get('debugLive') !== '1') return {};

  const overrides: Partial<Pick<LiveSessionConfig, 'maxTokens' | 'maxChars' | 'maxDuration'>> = {};

  const maxDuration = params.get('liveMaxDurationMs');
  if (maxDuration) {
    const parsed = parseInt(maxDuration, 10);
    if (!isNaN(parsed) && parsed > 0) {
      overrides.maxDuration = parsed;
    }
  }

  const maxTokens = params.get('liveMaxTokens');
  if (maxTokens) {
    const parsed = parseInt(maxTokens, 10);
    if (!isNaN(parsed) && parsed > 0) {
      overrides.maxTokens = parsed;
    }
  }

  const maxChars = params.get('liveMaxChars');
  if (maxChars) {
    const parsed = parseInt(maxChars, 10);
    if (!isNaN(parsed) && parsed > 0) {
      overrides.maxChars = parsed;
    }
  }

  return overrides;
}

export interface LiveSessionCallbacks {
  onToken?: (token: string) => void;
  onMessage?: (message: string) => void;
  onEvent?: (event: any) => void;
  onComplete?: () => void;
  onError?: (error: Error | string, errorCode?: string) => void;
  onAbort?: () => void;
}

export interface LiveSessionTelemetry {
  requestId: string;
  tokensReceived: number;
  eventsReceived: number;
  lastEventTs: number | null;
  streamDurationMs: number;
  state: LiveSessionState;
  // Gate C: Extended telemetry for debugging
  lastStartUrl: string | null;
  lastStartAt: number | null;
  startAttempts: number;
  lastError: string | null;
  errorCount: number;
  lastStateTransition: string | null;
}

// Global session manager: tek aktif stream garantisi
class LiveSessionManager {
  private activeSession: {
    abortController: AbortController;
    requestId: string;
    startTime: number;
  } | null = null;

  /**
   * Start a new session. If one is already active, abort it first.
   */
  start(config: LiveSessionConfig, callbacks: LiveSessionCallbacks): {
    abortController: AbortController;
    requestId: string;
  } {
    // Abort existing session if any
    if (this.activeSession) {
      this.activeSession.abortController.abort();
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const abortController = new AbortController();
    const startTime = Date.now();

    this.activeSession = {
      abortController,
      requestId,
      startTime,
    };

    // Start fetch + SSE parsing
    this.runStream(config, callbacks, abortController, requestId, startTime)
      .catch((error) => {
        if (error.name === 'AbortError') {
          // Normal abort, don't call onError
          callbacks.onAbort?.();
        } else {
          callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      })
      .finally(() => {
        // Clear active session if this was the active one
        if (this.activeSession?.requestId === requestId) {
          this.activeSession = null;
        }
      });

    return { abortController, requestId };
  }

  /**
   * Abort current session
   */
  abort(): boolean {
    if (this.activeSession) {
      this.activeSession.abortController.abort();
      this.activeSession = null;
      return true;
    }
    return false;
  }

  /**
   * Get current session info
   */
  getActiveSession(): { requestId: string; startTime: number } | null {
    if (!this.activeSession) return null;
    return {
      requestId: this.activeSession.requestId,
      startTime: this.activeSession.startTime,
    };
  }

  private async runStream(
    config: LiveSessionConfig,
    callbacks: LiveSessionCallbacks,
    abortController: AbortController,
    requestId: string,
    startTime: number
  ): Promise<void> {
    const {
      url,
      method = 'POST',
      body,
      headers = {},
      maxTokens = 10000,
      maxChars = 1000000,
      maxDuration = 60000, // 60s default
    } = config;

    let tokensReceived = 0;
    let eventsReceived = 0;
    let lastEventTs: number | null = null;
    let messageBuffer = '';
    let messageDone = false;

    // Check duration limit
    const durationCheck = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxDuration) {
        abortController.abort();
        callbacks.onError?.(
          new Error(`Stream duration limit exceeded (${maxDuration}ms)`),
          'DURATION_LIMIT_EXCEEDED'
        );
        clearInterval(durationCheck);
      }
    }, 1000);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Normal completion
          callbacks.onComplete?.();
          break;
        }

        if (abortController.signal.aborted) {
          // Abort detected, exit gracefully
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            eventsReceived++;
            lastEventTs = Date.now();

            try {
              const event = JSON.parse(data);

              // Gate C: Token assembly
              if (event.event === 'token') {
                if (messageDone) {
                  // Ignore tokens after message_done
                  continue;
                }

                const content = event.data?.content || event.content || '';
                if (content) {
                  tokensReceived++;
                  messageBuffer += content;

                  // Check limits
                  if (tokensReceived > maxTokens) {
                    abortController.abort();
                    callbacks.onError?.(
                      new Error(`Token limit exceeded (${maxTokens})`),
                      'TOKEN_LIMIT_EXCEEDED'
                    );
                    return;
                  }

                  if (messageBuffer.length > maxChars) {
                    abortController.abort();
                    callbacks.onError?.(
                      new Error(`Character limit exceeded (${maxChars})`),
                      'CHAR_LIMIT_EXCEEDED'
                    );
                    return;
                  }

                  // Emit token
                  callbacks.onToken?.(content);
                }
              } else if (event.event === 'message_done') {
                // Finalize message
                messageDone = true;
                if (messageBuffer) {
                  callbacks.onMessage?.(messageBuffer);
                }
              } else {
                // Other events
                callbacks.onEvent?.(event);
              }
            } catch (e) {
              // Skip malformed JSON
              console.warn('[LiveSession] Parse error:', e);
            }
          }
        }
      }

      clearInterval(durationCheck);
    } catch (error: any) {
      clearInterval(durationCheck);

      if (error.name === 'AbortError') {
        // Normal abort, don't throw
        return;
      }

      throw error;
    }
  }
}

// Singleton instance
const sessionManager = new LiveSessionManager();

/**
 * Gate C: Global store for live session state (shared between components)
 */
interface LiveSessionStore {
  state: LiveSessionState;
  telemetry: LiveSessionTelemetry;
  setState: (state: LiveSessionState) => void;
  setTelemetry: (updater: (prev: LiveSessionTelemetry) => LiveSessionTelemetry) => void;
  resetTelemetry: () => void;
}

const initialTelemetry: LiveSessionTelemetry = {
  requestId: '',
  tokensReceived: 0,
  eventsReceived: 0,
  lastEventTs: null,
  streamDurationMs: 0,
  state: 'idle',
  // Gate C: Extended telemetry
  lastStartUrl: null,
  lastStartAt: null,
  startAttempts: 0,
  lastError: null,
  errorCount: 0,
  lastStateTransition: null,
};

export const useLiveSessionStore = create<LiveSessionStore>((set) => ({
  state: 'idle',
  telemetry: initialTelemetry,
  setState: (state) => set({ state }),
  setTelemetry: (updater) => set((s) => ({ telemetry: updater(s.telemetry) })),
  resetTelemetry: () => set({ telemetry: initialTelemetry, state: 'idle' }),
}));

/**
 * React hook for live session management
 * Uses global store for state sharing between components
 */
export function useLiveSession() {
  const { state, telemetry, setState, setTelemetry } = useLiveSessionStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');

  const start = useCallback(
    (config: LiveSessionConfig, callbacks: LiveSessionCallbacks) => {
      // Gate C: Debug logging
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useLiveSession] start called', { url: config.url });
      }

      // Get store functions directly for use in callbacks
      const store = useLiveSessionStore.getState();

      store.setState('connecting');

      // Gate C: Update telemetry with start info
      store.setTelemetry((prev) => ({
        ...prev,
        lastStartUrl: config.url,
        lastStartAt: Date.now(),
        startAttempts: prev.startAttempts + 1,
        lastStateTransition: 'idle → connecting',
        lastError: null,
        // Reset counters for new session
        tokensReceived: 0,
        eventsReceived: 0,
        streamDurationMs: 0,
      }));

      // Gate C: Apply dev-only limit overrides
      const devOverrides = getDevLimitOverrides();
      const finalConfig = {
        ...config,
        ...devOverrides,
      };

      const { abortController, requestId } = sessionManager.start(
        finalConfig,
        {
          ...callbacks,
          onToken: (token) => {
            const s = useLiveSessionStore.getState();
            if (s.state === 'connecting') {
              s.setState('streaming');
              s.setTelemetry((t) => ({ ...t, lastStateTransition: 'connecting → streaming' }));
            }
            s.setTelemetry((prev) => ({
              ...prev,
              tokensReceived: prev.tokensReceived + 1,
            }));
            callbacks.onToken?.(token);
          },
          onEvent: (event) => {
            useLiveSessionStore.getState().setTelemetry((prev) => ({
              ...prev,
              eventsReceived: prev.eventsReceived + 1,
              lastEventTs: Date.now(),
            }));
            callbacks.onEvent?.(event);
          },
          onComplete: () => {
            const s = useLiveSessionStore.getState();
            s.setState('done');
            s.setTelemetry((prev) => ({
              ...prev,
              state: 'done',
              lastStateTransition: `${prev.state} → done`,
            }));
            callbacks.onComplete?.();
          },
          onError: (error, errorCode) => {
            const s = useLiveSessionStore.getState();
            s.setState('error');
            const errorMsg = error instanceof Error ? error.message : String(error);
            s.setTelemetry((prev) => ({
              ...prev,
              state: 'error',
              lastError: errorCode ? `${errorMsg} (${errorCode})` : errorMsg,
              errorCount: prev.errorCount + 1,
              lastStateTransition: `${prev.state} → error`,
            }));
            callbacks.onError?.(error, errorCode);
          },
          onAbort: () => {
            const s = useLiveSessionStore.getState();
            s.setState('aborted');
            s.setTelemetry((prev) => ({
              ...prev,
              state: 'aborted',
              lastStateTransition: `${prev.state} → aborted`,
            }));
            callbacks.onAbort?.();
          },
        }
      );

      abortControllerRef.current = abortController;
      requestIdRef.current = requestId;

      store.setTelemetry((prev) => ({
        ...prev,
        requestId,
        state: 'connecting',
      }));
    },
    []
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    sessionManager.abort();
    useLiveSessionStore.getState().setState('aborted');
  }, []);

  // Update stream duration
  useEffect(() => {
    if (state === 'streaming' || state === 'connecting') {
      const interval = setInterval(() => {
        const active = sessionManager.getActiveSession();
        if (active && active.requestId === requestIdRef.current) {
          setTelemetry((prev) => ({
            ...prev,
            streamDurationMs: Date.now() - active.startTime,
          }));
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state]);

  return {
    state,
    telemetry,
    start,
    abort,
    requestId: requestIdRef.current,
  };
}

