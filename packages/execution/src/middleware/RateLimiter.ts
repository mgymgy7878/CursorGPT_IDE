import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  burstLimit: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    burstCount: number;
    lastRequestTime: number;
  };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(req: NextRequest): string {
    // Use IP address as primary key
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    return `rate_limit:${ip}`;
  }

  private isRateLimitExceeded(key: string): boolean {
    const now = Date.now();
    const record = this.store[key];

    if (!record) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
        burstCount: 1,
        lastRequestTime: now
      };
      return false;
    }

    // Check if window has reset
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + this.config.windowMs;
      record.burstCount = 1;
      record.lastRequestTime = now;
      return false;
    }

    // Check burst limit
    const timeSinceLastRequest = now - record.lastRequestTime;
    if (timeSinceLastRequest < 1000) { // 1 second burst window
      record.burstCount++;
      if (record.burstCount > this.config.burstLimit) {
        return true;
      }
    } else {
      record.burstCount = 1;
    }

    // Check regular limit
    record.count++;
    record.lastRequestTime = now;

    return record.count > this.config.maxRequests;
  }

  private getRateLimitHeaders(key: string): Record<string, string> {
    const record = this.store[key];
    if (!record) {
      return {
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': (this.config.maxRequests - 1).toString(),
        'X-RateLimit-Reset': (Date.now() + this.config.windowMs).toString()
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - record.count);
    return {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': record.resetTime.toString()
    };
  }

  middleware() {
    return (req: NextRequest) => {
      const key = this.getKey(req);
      
      if (this.isRateLimitExceeded(key)) {
        console.warn(`Rate limit exceeded for ${key}`);
        
        return NextResponse.json(
          { error: 'Rate limit exceeded', message: 'Too many requests' },
          { status: 429, headers: this.getRateLimitHeaders(key) }
        );
      }

      // Add rate limit headers to successful requests
      const response = NextResponse.next();
      const headers = this.getRateLimitHeaders(key);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    };
  }

  // Clean up expired records
  cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      const record = this.store[key];
      if (record && now > record.resetTime + 60000) { // Keep for 1 minute after reset
        delete this.store[key];
      }
    });
  }

  // Get current rate limit status for a key
  getStatus(key: string) {
    const record = this.store[key];
    if (!record) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        burstCount: 0
      };
    }

    return {
      count: record.count,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime,
      burstCount: record.burstCount
    };
  }
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    burstLimit: 5
  },
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    burstLimit: 20
  },
  relaxed: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
    burstLimit: 40
  }
} as const;

// Export singleton instances
export const strictRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.strict);
export const standardRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.standard);
export const relaxedRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.relaxed); 