const seen = new Map<string, number>();

function idemKey(parts: Record<string, any>) {
  return Buffer.from(JSON.stringify(parts)).toString('base64url');
}

function checkAndMark(key: string, ttlMs = 60_000) {
  const now = Date.now();
  const ts = seen.get(key);
  if (ts && (now - ts) < ttlMs) return false;
  seen.set(key, now);
  for (const [k, t] of seen) if (now - t > ttlMs) seen.delete(k);
  return true;
}

export { idemKey, checkAndMark }; 