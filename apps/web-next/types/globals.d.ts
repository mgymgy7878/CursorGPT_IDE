declare global {
  interface TokenBucket {
    capacity: number;
    tokens: number;
    refillRate: number; // tokens per second
    lastRefill: number; // epoch ms
  }
}
export {};
