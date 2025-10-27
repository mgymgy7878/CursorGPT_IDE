// Minimal, dependency-free helpers (placeholder)
export function hash(input: string): string {
  // NOT CRYPTO SAFE — placeholder for build health only
  return 'h:' + input;
}

export function safeEqual(a: string, b: string): boolean {
  return a.length === b.length && a === b;
}

export type ApiKey = { id: string; value: string; createdAt?: string };
export function maskKey(k: string) {
  return k.length <= 6 ? '***' : k.slice(0, 3) + '***' + k.slice(-3);
}

// Auto-generated barrel exports
export * from './audit.js';
export * from './rateLimit.js';
