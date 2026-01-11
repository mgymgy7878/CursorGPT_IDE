/**
 * ConfirmationTokenStore (P1.1)
 *
 * Secure confirmation token management:
 * - TTL (5 minutes default)
 * - Single-use (replay prevention)
 * - Hash-based validation (token cannot be reused with different params)
 * - Token hash stored in audit (token itself never logged)
 */

import { createHash } from 'crypto';

export interface ConfirmationTokenData {
  token: string;
  params: Record<string, any>;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

/**
 * In-memory token store (P1.1: Can be moved to Redis/DB later)
 */
class ConfirmationTokenStore {
  private tokens = new Map<string, ConfirmationTokenData>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  // P1.1 Hardening: Allow test mode with shorter TTL (env var for smoke tests)
  private readonly DEFAULT_TTL_MS = process.env.TOKEN_TTL_MS
    ? parseInt(process.env.TOKEN_TTL_MS, 10)
    : 5 * 60 * 1000; // 5 minutes default, 10s for tests

  constructor() {
    // Cleanup expired tokens every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Generate a new confirmation token
   */
  generate(params: Record<string, any>, ttlMs: number = this.DEFAULT_TTL_MS): string {
    const token = `confirm_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
    const now = Date.now();

    this.tokens.set(token, {
      token,
      params,
      createdAt: now,
      expiresAt: now + ttlMs,
      used: false,
    });

    return token;
  }

  /**
   * Validate and consume token (single-use)
   */
  validateAndConsume(token: string, params: Record<string, any>): {
    valid: boolean;
    error?: string;
    errorCode?: string;
  } {
    const data = this.tokens.get(token);

    // Token not found
    if (!data) {
      return {
        valid: false,
        error: 'Invalid confirmation token',
        errorCode: 'NOT_FOUND',
      };
    }

    // Token already used (replay prevention)
    if (data.used) {
      return {
        valid: false,
        error: 'Confirmation token already used',
        errorCode: 'POLICY_DENIED',
      };
    }

    // Token expired
    if (Date.now() > data.expiresAt) {
      this.tokens.delete(token);
      return {
        valid: false,
        error: 'Confirmation token expired',
        errorCode: 'POLICY_DENIED',
      };
    }

    // P1.1: Hash-based validation - params must match
    const storedParamsHash = this.hashParams(data.params);
    const providedParamsHash = this.hashParams(params);

    if (storedParamsHash !== providedParamsHash) {
      return {
        valid: false,
        error: 'Confirmation token params mismatch',
        errorCode: 'POLICY_DENIED',
      };
    }

    // Mark as used (single-use)
    data.used = true;
    this.tokens.set(token, data);

    return { valid: true };
  }

  /**
   * Get token hash for audit (never log token itself)
   */
  getTokenHash(token: string): string | null {
    const data = this.tokens.get(token);
    if (!data) return null;

    return createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * Hash params for comparison (canonical JSON with recursive key sorting)
   *
   * P1.1 Hardening: Ensures deterministic hashing even with nested objects.
   * Uses stable stringification (sorted keys at all levels).
   */
  private hashParams(params: Record<string, any>): string {
    const canonical = this.stableStringify(params);
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Stable stringify with recursive key sorting (deterministic JSON)
   *
   * P1.1 Hardening: Handles Date, BigInt, undefined for consistent hashing
   * P1.2 Security: Circular reference detection to prevent stack overflow
   */
  private stableStringify(obj: any): string {
    const seen = new WeakSet(); // Track visited objects for circular detection

    const stringify = (value: any): string => {
      if (value === null) {
        return 'null';
      }

      if (value === undefined) {
        return 'undefined'; // Explicit handling
      }

      // Date: normalize to ISO string
      if (value instanceof Date) {
        return JSON.stringify(value.toISOString());
      }

      // BigInt: convert to string
      if (typeof value === 'bigint') {
        return JSON.stringify(value.toString());
      }

      if (typeof value !== 'object') {
        return JSON.stringify(value);
      }

      // P1.2 Security: Circular reference detection
      if (seen.has(value)) {
        return '"[Circular]"'; // Sentinel for circular references
      }
      seen.add(value);

      try {
        if (Array.isArray(value)) {
          const result = `[${value.map(item => stringify(item)).join(',')}]`;
          seen.delete(value); // Clean up after processing
          return result;
        }

        // Object: sort keys recursively
        const sortedKeys = Object.keys(value).sort();
        const entries = sortedKeys.map(key => {
          const item = value[key];
          // Skip undefined values (consistent with JSON.stringify behavior)
          if (item === undefined) {
            return null; // Will be filtered
          }
          const itemStr = typeof item === 'object' && item !== null
            ? stringify(item)
            : JSON.stringify(item);
          return `${JSON.stringify(key)}:${itemStr}`;
        }).filter(entry => entry !== null);

        seen.delete(value); // Clean up after processing
        return `{${entries.join(',')}}`;
      } catch (error) {
        seen.delete(value); // Ensure cleanup on error
        // P1.2 Security: If stringify fails, return error sentinel
        return `"[StringifyError: ${error instanceof Error ? error.message : 'unknown'}]"`;
      }
    };

    return stringify(obj);
  }

  /**
   * Cleanup expired tokens
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Destroy store (for testing/cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.tokens.clear();
  }
}

// Singleton instance
export const confirmationTokenStore = new ConfirmationTokenStore();


