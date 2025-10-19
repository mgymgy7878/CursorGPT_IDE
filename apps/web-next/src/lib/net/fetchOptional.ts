/**
 * Graceful fetch wrapper for optional/non-critical API calls
 * Returns { ok: boolean, data?: T, _mock?: boolean }
 * Never throws, never triggers toast - silent fallback
 */

export type OptionalResponse<T = any> = {
  ok: boolean;
  data?: T;
  _mock?: boolean;
  _err?: string;
};

/**
 * Fetch with graceful degradation
 * - 200 → ok: true, data
 * - 4xx/5xx → ok: false (silent)
 * - Network error → ok: false (silent)
 */
export async function fetchOptional<T = any>(
  url: string,
  init?: RequestInit
): Promise<OptionalResponse<T>> {
  try {
    const r = await fetch(url, { ...init, cache: 'no-store' as any });
    
    if (!r.ok) {
      // Non-2xx response - silent fallback
      return { 
        ok: false, 
        _err: `http_${r.status}` 
      };
    }
    
    const data = await r.json().catch(() => ({}));
    
    return { 
      ok: true, 
      data: data as T, 
      _mock: (data as any)?._mock === true 
    };
  } catch (e: any) {
    // Network error - silent fallback
    return { 
      ok: false, 
      _err: e?.message || 'network_error' 
    };
  }
}

/**
 * Batch fetch with parallel requests
 * Returns array of results, never throws
 */
export async function fetchOptionalBatch<T = any>(
  urls: string[],
  init?: RequestInit
): Promise<OptionalResponse<T>[]> {
  return Promise.all(urls.map(url => fetchOptional<T>(url, init)));
}

/**
 * Fetch with timeout
 */
export async function fetchOptionalWithTimeout<T = any>(
  url: string,
  timeoutMs: number = 5000,
  init?: RequestInit
): Promise<OptionalResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const result = await fetchOptional<T>(url, {
      ...init,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return result;
  } catch {
    clearTimeout(timeout);
    return { ok: false, _err: 'timeout' };
  }
}

