export type ApiError = { code?: string; message: string };
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError };

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
  try {
    if (token) localStorage.setItem('authToken', token); else localStorage.removeItem('authToken');
  } catch {}
}
export function getAuthToken(): string | null {
  if (authToken) return authToken;
  try { const t = localStorage.getItem('authToken'); authToken = t; return t; } catch { return null; }
}

export async function postJSON<T>(url: string, body: unknown, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    ...init
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error?.message ?? 'API error');
  return json.data;
}

export function connectSSE(url: string, onMessage: (ev: MessageEvent) => void, onError?: (e: Event) => void): () => void {
  const token = getAuthToken();
  const u = new URL(url, window.location.origin);
  if (token && !u.searchParams.has('token')) u.searchParams.set('token', token);
  const es = new EventSource(u.toString());
  es.onmessage = onMessage;
  es.onerror = (e) => { onError?.(e); es.close(); };
  return () => es.close();
}

export async function toggleSupervisor(run: boolean) {
  const resp = await fetch('/api/admin/supervisor/toggle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ run })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`toggleSupervisor failed: ${resp.status} ${JSON.stringify(err)}`);
  }
  return resp.json();
}

// Idempotent API helpers for auth cookie flow
export async function apiSignOut(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
}

export async function apiRefresh(): Promise<{ ok?: boolean; refreshed?: boolean; exp?: number | null }> {
  const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
  try { return await r.json(); } catch { return { ok: false }; }
}

// Idempotent: apiMe yoksa eklenir; mevcutsa bu ek blok ikinci kez uygulanmaz
export async function apiMe() {
  const r = await fetch('/api/protected/me', { credentials: 'include' });
  try { return await r.json(); } catch { return null; }
}

export async function fetcherNoStore<T = unknown>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status}: ${text || r.statusText}`);
  }
  const ct = r.headers.get('content-type') || '';
  return (ct.includes('application/json') ? (await r.json()) : ((await r.text()) as unknown)) as T;
} 
