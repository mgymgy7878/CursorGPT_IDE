async function retry<T>(
  fn: () => Promise<T>,
  opts = { retries: 5, baseMs: 200, maxMs: 4000 }
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try { 
      return await fn(); 
    } catch (e) {
      attempt++;
      if (attempt > opts.retries) throw e;
      const expo = Math.min(opts.maxMs, opts.baseMs * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * (expo / 2));
      await new Promise(r => setTimeout(r, expo/2 + jitter));
    }
  }
}

export { retry }; 