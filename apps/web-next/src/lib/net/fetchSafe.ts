// Merkezi fetch utility: timeout, retry, telemetri
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json = Record<string, any>;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export interface FetchSafeOpts {
  timeoutMs?: number;          // default 3500
  retries?: number;            // default 2
  retryDelayBaseMs?: number;   // default 200 (jitter eklenecek)
  headers?: Record<string,string>;
  method?: 'GET'|'POST'|'PUT'|'DELETE';
  body?: Json | undefined;
}

export async function fetchSafe(url: string, opts: FetchSafeOpts = {}) {
  const {
    timeoutMs = 3500,
    retries = 2,
    retryDelayBaseMs = 200,
    headers = {},
    method = 'GET',
    body
  } = opts;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const baseHeaders: Record<string,string> = {
    'Content-Type': 'application/json',
    'X-Spark-Actor': 'ui',
    'x-trace-id': `ui-${Date.now()}-${Math.random().toString(16).slice(2)}`
  };
  const mergedHeaders = { ...baseHeaders, ...headers };

  let attempt = 0;
  let lastErr: unknown;
  const payload = body ? JSON.stringify(body) : undefined;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, { method, headers: mergedHeaders, body: payload, signal: controller.signal, cache: 'no-store' });
      clearTimeout(id);
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      return { ok: res.ok, status: res.status, headers: res.headers, data: json };
    } catch (e) {
      lastErr = e;
      attempt++;
      if (attempt > retries) break;
      const jitter = Math.floor(Math.random()*retryDelayBaseMs);
      await sleep(retryDelayBaseMs + jitter);
    }
  }
  clearTimeout(id);
  return { ok: false, status: 0, headers: new Headers(), data: { _err: String((lastErr as Error)?.message ?? 'unknown') } };
}

