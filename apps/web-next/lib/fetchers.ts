export async function fetchNoStore<T = any>(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const to = setTimeout(()=>controller.abort(), 1500);
  const r = await fetch(input, { ...init, cache:'no-store', signal: controller.signal });
  clearTimeout(to);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
} 