/**
 * SSE Retry mechanism with exponential backoff.
 * Handles network interruptions and connection failures gracefully.
 * 
 * @fileoverview Provides robust SSE retry for Chat/Agent connections
 * @author Spark Trading Platform
 * @version 1.0.0
 */

import { randomUUID } from 'crypto';

export interface RetryConfig {
  /** Backoff intervals in milliseconds */
  backoffMs: number[];
  /** Maximum number of retries */
  maxRetries: number;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Whether to use idempotent request IDs */
  useRequestId: boolean;
}

export interface RetryResult<T> {
  /** Success result */
  result?: T;
  /** Error if all retries failed */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent retrying */
  totalTimeMs: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  backoffMs: [500, 1000, 2000, 5000], // 0.5s, 1s, 2s, 5s
  maxRetries: 3,
  timeoutMs: 30000, // 30 seconds
  useRequestId: true
};

/**
 * Execute a function with SSE retry logic
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Promise with retry result
 * 
 * @example
 * ```typescript
 * const result = await withSseRetry(async () => {
 *   const response = await fetch('/api/ai/chat', {
 *     method: 'POST',
 *     body: JSON.stringify(payload)
 *   });
 *   return response;
 * });
 * 
 * if (result.result) {
 *   console.log('Success after', result.attempts, 'attempts');
 * }
 * ```
 */
export async function withSseRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), finalConfig.timeoutMs)
        )
      ]);
      
      return {
        result,
        attempts: attempt + 1,
        totalTimeMs: Date.now() - startTime
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt >= finalConfig.maxRetries) {
        break;
      }
      
      // Wait before next retry
      const backoffMs = finalConfig.backoffMs[Math.min(attempt, finalConfig.backoffMs.length - 1)];
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  return {
    error: lastError,
    attempts: finalConfig.maxRetries + 1,
    totalTimeMs: Date.now() - startTime
  };
}

/**
 * Create headers with idempotent request ID
 * @param existingHeaders - Existing headers
 * @returns Headers with request ID
 */
export function createIdempotentHeaders(existingHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    ...existingHeaders,
    'x-request-id': randomUUID(),
    'x-retry-enabled': 'true'
  };
}

/**
 * Execute SSE request with retry and idempotent headers
 * @param url - Request URL
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Promise with retry result
 * 
 * @example
 * ```typescript
 * const result = await sseRequestWithRetry('/api/ai/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(payload)
 * });
 * ```
 */
export async function sseRequestWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<Response>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  return withSseRetry(async () => {
    const headers = finalConfig.useRequestId 
      ? createIdempotentHeaders(options.headers as Record<string, string>)
      : options.headers;
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }, finalConfig);
}

/**
 * Check if an error is retryable
 * @param error - Error to check
 * @returns True if error should trigger retry
 */
export function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /econnreset/i,
    /enotfound/i,
    /etimedout/i,
    /serialization/i,
    /json/i,
    /ECONNRESET/i,
    /ETIMEDOUT/i,
    /408/i,
    /429/i,
    /502/i,
    /503/i,
    /504/i
  ];
  
  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Enhanced SSE retry with error classification
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Promise with retry result
 */
export async function withSmartSseRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), finalConfig.timeoutMs)
        )
      ]);
      
      return {
        result,
        attempts: attempt + 1,
        totalTimeMs: Date.now() - startTime
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if error is not retryable
      if (!isRetryableError(lastError)) {
        break;
      }
      
      // Don't retry on the last attempt
      if (attempt >= finalConfig.maxRetries) {
        break;
      }
      
      // Wait before next retry
      const backoffMs = finalConfig.backoffMs[Math.min(attempt, finalConfig.backoffMs.length - 1)];
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  return {
    error: lastError,
    attempts: finalConfig.maxRetries + 1,
    totalTimeMs: Date.now() - startTime
  };
}
