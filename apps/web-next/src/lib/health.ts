export async function fetchJson(url: string) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}
