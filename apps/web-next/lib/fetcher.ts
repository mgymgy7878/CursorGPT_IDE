export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 }, ...(init ?? {}) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T; // TS18046 'unknown' → T
}
