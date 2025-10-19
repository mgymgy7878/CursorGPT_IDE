/**
 * API Client with graceful degradation
 * Handles timeouts, retries, and fallbacks
 */

export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  isMock: boolean;
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  fallback?: any;
}

const DEFAULT_OPTIONS: Required<FetchOptions> = {
  timeout: 1500,
  retries: 1,
  retryDelay: 300,
  fallback: null,
};

/**
 * Fetch with timeout and retry
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit & FetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = DEFAULT_OPTIONS.timeout,
    retries = DEFAULT_OPTIONS.retries,
    retryDelay = DEFAULT_OPTIONS.retryDelay,
    fallback = DEFAULT_OPTIONS.fallback,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        ok: true,
        data: data as T,
        error: null,
        isMock: data._mock === true,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');

      // Don't retry on last attempt
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All retries failed - return fallback
  return {
    ok: false,
    data: fallback,
    error: lastError?.message || 'Request failed',
    isMock: true,
  };
}

/**
 * Check if executor is online
 */
export async function checkExecutorHealth(): Promise<boolean> {
  try {
    const executorUrl =
      typeof window !== 'undefined'
        ? window.location.protocol + '//' + window.location.hostname + ':4001'
        : 'http://127.0.0.1:4001';

    const response = await fetch(`${executorUrl}/health`, {
      signal: AbortSignal.timeout(1000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch strategies with fallback
 */
export async function fetchStrategies(): Promise<ApiResponse<{ items: any[] }>> {
  const fallback = { items: [] };

  // Try running strategies first
  const runningResult = await fetchWithTimeout<{ items: any[] }>(
    '/api/strategies/running',
    { fallback, timeout: 1200 }
  );

  if (runningResult.ok && runningResult.data && runningResult.data.items.length > 0) {
    return runningResult;
  }

  // Fallback to tools API
  const ordersResult = await fetchWithTimeout<{ items: any[] }>(
    '/api/tools/get_orders',
    {
      method: 'POST',
      body: JSON.stringify({}),
      fallback,
      timeout: 1200,
    }
  );

  return ordersResult;
}

/**
 * Fetch market health metrics
 */
export async function fetchMarketHealth(): Promise<
  ApiResponse<{
    p95: number | null;
    staleness: number | null;
    errorRate: number | null;
    status: string;
  }>
> {
  const fallback = {
    p95: 45,
    staleness: 2,
    errorRate: 0.1,
    status: 'healthy',
  };

  return fetchWithTimeout('/api/tools/metrics/timeseries?window=1h', {
    fallback,
    timeout: 1500,
  });
}

/**
 * Fetch latest alerts
 */
export async function fetchLatestAlert(): Promise<
  ApiResponse<{
    status: string;
    metrics?: {
      p95Ms?: number;
      stalenessS?: number;
      exitCode?: number;
    };
  }>
> {
  const fallback = {
    status: 'DEMO',
  };

  // Check executor first
  const executorOnline = await checkExecutorHealth();
  if (!executorOnline) {
    return {
      ok: false,
      data: { ...fallback, status: 'OFFLINE' },
      error: 'Executor offline',
      isMock: true,
    };
  }

  return fetchWithTimeout('/api/public/alert/last', {
    fallback,
    timeout: 1500,
  });
}

