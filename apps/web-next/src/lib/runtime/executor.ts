/**
 * Executor runtime status management
 * Single source of truth for "is executor online?"
 */

type ExecutorStatus = {
  online: boolean;
  ts: number; // Last attempt timestamp
  lastSuccessAt?: number; // Last successful check timestamp (only set when online=true)
};

let cached: ExecutorStatus | null = null;
let inFlightRefresh: Promise<boolean> | null = null; // Single-flight guard

const CACHE_TTL_MS = 15_000; // 15 seconds
const HEALTH_ENDPOINT = "/api/guardrails/read"; // Lightweight health check

/**
 * Check if executor is online
 * - Caches result for 15s to avoid hammering
 * - Graceful fallback: offline on error
 * - Never throws
 */
export async function isExecutorOnline(): Promise<boolean> {
  const now = Date.now();

  // Return cached result if still fresh
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.online;
  }

  try {
    // AbortController ile timeout (daha güvenli)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3_000);

    const r = await fetch(HEALTH_ENDPOINT, {
      cache: "no-store" as any,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const online = r.ok;
    cached = { online, ts: now };

    return online;
  } catch {
    // Network error or timeout → offline
    cached = {
      online: false,
      ts: now,
      lastSuccessAt: cached?.lastSuccessAt, // Preserve last success timestamp
    };
    return false;
  }
}

/**
 * Force refresh executor status (bypass cache)
 * Single-flight: Aynı anda birden fazla tetik gelirse tek fetch koşar, diğerleri aynı Promise'i await eder
 */
export async function refreshExecutorStatus(): Promise<boolean> {
  // Eğer zaten bir refresh devam ediyorsa, aynı Promise'i döndür
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  // Yeni refresh başlat
  inFlightRefresh = (async () => {
    try {
      cached = null; // Cache'i bypass et
      const online = await isExecutorOnline();
      return online;
    } finally {
      // Refresh tamamlandığında inFlightRefresh'i temizle
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

/**
 * Get cached executor status without network call
 * Returns null if no cache available
 */
export function getCachedExecutorStatus(): boolean | null {
  if (!cached) return null;

  const now = Date.now();
  const isStale = now - cached.ts > CACHE_TTL_MS;

  return isStale ? null : cached.online;
}

/**
 * Get cached executor status timestamps (for staleness display)
 * Returns null if no cache available
 */
export function getCachedExecutorTimestamps(): {
  lastAttemptAt: number;
  lastSuccessAt: number | null;
} | null {
  if (!cached) return null;
  return {
    lastAttemptAt: cached.ts,
    lastSuccessAt: cached.lastSuccessAt ?? null,
  };
}

// Singleton watcher guard (tek watcher instance)
let globalWatcher: {
  callbacks: Set<(online: boolean) => void>;
  interval: NodeJS.Timeout | null;
  lastStatus: boolean | null;
  isActive: boolean;
} | null = null;

/**
 * Subscribe to executor status changes (singleton watcher)
 * Polls every 30s and calls all registered callbacks on change
 * Guarantees: single interval, proper cleanup, timeout protection
 */
export function watchExecutorStatus(
  callback: (online: boolean) => void,
  intervalMs: number = 30_000
): () => void {
  // Initialize singleton watcher if needed
  if (!globalWatcher) {
    globalWatcher = {
      callbacks: new Set(),
      interval: null,
      lastStatus: null,
      isActive: false,
    };
  }

  // Register callback
  globalWatcher.callbacks.add(callback);

  // Start watcher if not already active
  if (!globalWatcher.isActive) {
    globalWatcher.isActive = true;

    const check = async () => {
      if (!globalWatcher) return;

      try {
        // isExecutorOnline() zaten timeout'lu (3s), direkt çağır
        const online = await isExecutorOnline();

        if (globalWatcher && online !== globalWatcher.lastStatus) {
          globalWatcher.lastStatus = online;
          // Notify all callbacks
          globalWatcher.callbacks.forEach((cb) => {
            try {
              cb(online);
            } catch (err) {
              console.warn("[watchExecutorStatus] Callback error:", err);
            }
          });
        }
      } catch (err) {
        // Network error: assume offline (isExecutorOnline never throws, but guard anyway)
        if (globalWatcher && globalWatcher.lastStatus !== false) {
          globalWatcher.lastStatus = false;
          globalWatcher.callbacks.forEach((cb) => {
            try {
              cb(false);
            } catch (callbackErr) {
              console.warn("[watchExecutorStatus] Callback error:", callbackErr);
            }
          });
        }
      }
    };

    // Initial check
    check();

    // Periodic check
    globalWatcher.interval = setInterval(check, intervalMs);
  } else {
    // Watcher already active, send current status immediately
    if (globalWatcher.lastStatus !== null) {
      try {
        callback(globalWatcher.lastStatus);
      } catch (err) {
        console.warn("[watchExecutorStatus] Initial callback error:", err);
      }
    }
  }

  // Cleanup function: unregister callback
  return () => {
    if (!globalWatcher) return;

    globalWatcher.callbacks.delete(callback);

    // If no more callbacks, stop watcher
    if (globalWatcher.callbacks.size === 0 && globalWatcher.interval) {
      clearInterval(globalWatcher.interval);
      globalWatcher.interval = null;
      globalWatcher.isActive = false;
      globalWatcher.lastStatus = null;
    }
  };
}

