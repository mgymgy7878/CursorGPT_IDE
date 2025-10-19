/**
 * Rate Limiting - Token Bucket Algorithm
 * Per-venue rate limiting with 429 audit logging
 */

export interface RateLimitConfig {
  maxTokens: number;      // Bucket size
  refillRate: number;     // Tokens per second
  venue: string;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimitConfig;
  private violations: number = 0;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   * Returns true if allowed, false if rate limited
   */
  tryConsume(cost: number = 1): boolean {
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }

    this.violations++;
    this.log429();
    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.config.refillRate;

    this.tokens = Math.min(
      this.config.maxTokens,
      this.tokens + tokensToAdd
    );

    this.lastRefill = now;
  }

  /**
   * Log 429 violation
   */
  private log429() {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} | RATE_LIMIT | ${this.config.venue} | violation #${this.violations}`;
    
    // In real implementation, write to file
    console.warn(`[RATE_LIMIT] ${logEntry}`);
  }

  /**
   * Get current state
   */
  getState() {
    return {
      venue: this.config.venue,
      tokens: Math.floor(this.tokens),
      maxTokens: this.config.maxTokens,
      violations: this.violations,
      utilizationPct: ((this.config.maxTokens - this.tokens) / this.config.maxTokens) * 100,
    };
  }

  /**
   * Reset violations counter
   */
  resetViolations() {
    this.violations = 0;
  }
}

/**
 * Rate limiter registry
 */
const limiters = new Map<string, RateLimiter>();

/**
 * Get or create rate limiter for venue
 */
export function getRateLimiter(venue: string): RateLimiter {
  if (!limiters.has(venue)) {
    // Default configs per venue
    const config: RateLimitConfig = {
      venue,
      maxTokens: venue === 'btcturk' ? 100 : 50,
      refillRate: venue === 'btcturk' ? 10 : 5, // tokens per second
    };
    
    limiters.set(venue, new RateLimiter(config));
  }
  
  return limiters.get(venue)!;
}

/**
 * Check rate limit before request
 */
export async function withRateLimit<T>(
  venue: string,
  fn: () => Promise<T>,
  cost: number = 1
): Promise<T> {
  const limiter = getRateLimiter(venue);

  if (!limiter.tryConsume(cost)) {
    throw new Error(`Rate limit exceeded for ${venue}`);
  }

  return fn();
}

