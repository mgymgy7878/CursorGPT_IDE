import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

/**
 * Default fetcher for useApi
 */
const defaultFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('API request failed');
    (error as any).status = res.status;
    (error as any).info = await res.json().catch(() => ({}));
    throw error;
  }
  return res.json();
};

/**
 * SWR wrapper with default fetcher and options
 * 
 * @example
 * const { data, error, isLoading } = useApi<Strategy[]>('/api/strategies');
 * const { data } = useApi<Health>('/api/services/health', { refreshInterval: 10000 });
 */
export function useApi<T = any>(
  key: string | null,
  options?: SWRConfiguration
): SWRResponse<T, Error> {
  return useSWR<T, Error>(
    key,
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      ...options
    }
  );
}

/**
 * POST/PUT/DELETE helper with optimistic updates
 */
export async function mutateApi<T = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = new Error(`${method} request failed`);
    (error as any).status = res.status;
    (error as any).info = await res.json().catch(() => ({}));
    throw error;
  }

  return res.json();
}

