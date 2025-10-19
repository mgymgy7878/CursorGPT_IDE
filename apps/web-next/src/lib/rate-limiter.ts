/**
 * Rate Limiter - Token Bucket Implementation
 * Per-venue rate limiting with audit logging
 */

interface RateLimitConfig {
  rpm: number; // requests per minute
  burst: number; // burst capacity
}

interface VenueLimiter {
  tokens: number;
  lastRefill: number;
  config: RateLimitConfig;
}

class RateLimiter {
  private limiters: Map<string, VenueLimiter> = new Map();
  private auditLog: string[] = [];

  constructor() {
    // Initialize venue limiters
    this.limiters.set('btcturk', {
      tokens: 60,
      lastRefill: Date.now(),
      config: { rpm: 60, burst: 60 }
    });
    
    this.limiters.set('bist', {
      tokens: 30,
      lastRefill: Date.now(),
      config: { rpm: 30, burst: 30 }
    });
  }

  private refillTokens(venue: string): void {
    const limiter = this.limiters.get(venue);
    if (!limiter) return;

    const now = Date.now();
    const timePassed = (now - limiter.lastRefill) / 1000; // seconds
    const tokensToAdd = (timePassed / 60) * limiter.config.rpm; // tokens per minute
    
    limiter.tokens = Math.min(
      limiter.config.burst,
      limiter.tokens + tokensToAdd
    );
    limiter.lastRefill = now;
  }

  public checkLimit(venue: string): { allowed: boolean; remaining: number; resetTime: number } {
    const limiter = this.limiters.get(venue);
    if (!limiter) {
      return { allowed: true, remaining: 999, resetTime: Date.now() + 60000 };
    }

    this.refillTokens(venue);

    if (limiter.tokens >= 1) {
      limiter.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(limiter.tokens),
        resetTime: limiter.lastRefill + 60000
      };
    }

    // Rate limit exceeded
    this.auditLog.push(JSON.stringify({
      timestamp: new Date().toISOString(),
      venue,
      event: 'RATE_LIMIT_EXCEEDED',
      remaining: 0,
      config: limiter.config
    }));

    return {
      allowed: false,
      remaining: 0,
      resetTime: limiter.lastRefill + 60000
    };
  }

  public getAuditLog(): string[] {
    return [...this.auditLog];
  }

  public clearAuditLog(): void {
    this.auditLog = [];
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Prometheus metrics helpers
export function getPrometheusMetrics(): string[] {
  const metrics: string[] = [];
  const auditLog = rateLimiter.getAuditLog();
  
  // Count rate limit events
  const rateLimitCount = auditLog.filter(entry => {
    const parsed = JSON.parse(entry);
    return parsed.event === 'RATE_LIMIT_EXCEEDED';
  }).length;

  metrics.push('# HELP venue_http_429_total Total rate limit violations by venue');
  metrics.push('# TYPE venue_http_429_total counter');
  metrics.push(`venue_http_429_total ${rateLimitCount}`);
  metrics.push('');

  return metrics;
}
