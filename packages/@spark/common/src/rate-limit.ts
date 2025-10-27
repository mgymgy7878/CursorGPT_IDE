export interface RateLimiterOptions {
  intervalMs: number;
  maxInInterval: number;
}

export class SimpleRateLimiter {
  private readonly times: number[] = [];
  
  constructor(private readonly opts: RateLimiterOptions) {}
  
  allow(): boolean {
    const t = Date.now();
    const windowStart = t - this.opts.intervalMs;
    
    while (this.times.length && (this.times[0] ?? 0) < windowStart) {
      this.times.shift();
    }
    
    if ((this.times?.length ?? 0) >= this.opts.maxInInterval) return false;
    
    this.times.push(t);
    return true;
  }
} 