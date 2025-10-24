/**
 * Idempotency Store with TTL and Race Prevention
 * 
 * Features:
 * - Prevents duplicate requests
 * - Handles concurrent requests (race prevention)
 * - Auto-expire after TTL (24-48h)
 * - Returns cached results for completed requests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TTL_HOURS = 48;

export interface IdempotencyOptions {
  ttlHours?: number;
}

/**
 * Execute function with idempotency guarantee
 * 
 * @param key - Unique idempotency key (e.g., UUID from X-Idempotency-Key header)
 * @param fn - Function to execute
 * @param options - Configuration options
 * @returns Result of function execution
 * 
 * @throws Error if duplicate in-flight request detected
 * 
 * @example
 * const result = await withIdempotency(
 *   req.headers['x-idempotency-key'],
 *   async () => placeOrder(orderData)
 * );
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
  options: IdempotencyOptions = {}
): Promise<T> {
  const { ttlHours = DEFAULT_TTL_HOURS } = options;
  const ttlAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  
  // Check for existing request
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });
  
  if (existing) {
    // ✅ Request already completed - return cached result
    if (existing.status === 'completed') {
      console.log(`♻️ Returning cached result for key: ${key}`);
      return existing.result as T;
    }
    
    // ❌ Request in progress - prevent race condition
    if (existing.status === 'pending') {
      throw new Error('Duplicate request in progress - please retry later');
    }
    
    // ⚠️ Previous request failed - allow retry
    if (existing.status === 'failed') {
      console.log(`🔄 Retrying failed request: ${key}`);
      // Delete old record and continue
      await prisma.idempotencyKey.delete({ where: { key } });
    }
  }
  
  // Create pending record (prevents race)
  try {
    await prisma.idempotencyKey.create({
      data: {
        key,
        status: 'pending',
        ttlAt,
      },
    });
  } catch (err) {
    // Unique constraint violation = race condition
    throw new Error('Concurrent request detected - please retry');
  }
  
  try {
    // Execute function
    const result = await fn();
    
    // Update with result
    await prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: 'completed',
        result: result as any,
      },
    });
    
    console.log(`✅ Request completed: ${key}`);
    
    return result;
    
  } catch (error) {
    // Mark as failed
    await prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: 'failed',
        result: { error: error instanceof Error ? error.message : String(error) } as any,
      },
    });
    
    console.error(`❌ Request failed: ${key}`, error);
    
    throw error;
  }
}

// ============================================
// Garbage Collection
// ============================================

/**
 * Delete expired idempotency keys
 * 
 * Run this periodically (e.g., every hour) to prevent unbounded growth.
 * 
 * @returns Number of keys deleted
 * 
 * @example
 * // In cron job
 * setInterval(gcIdempotencyKeys, 60 * 60 * 1000); // Every hour
 */
export async function gcIdempotencyKeys(): Promise<number> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      ttlAt: {
        lt: new Date(),
      },
    },
  });
  
  if (result.count > 0) {
    console.log(`🗑️ GC: Deleted ${result.count} expired idempotency keys`);
  }
  
  return result.count;
}

// ============================================
// Monitoring
// ============================================

export async function getIdempotencyStats() {
  const [total, pending, completed, failed, expired] = await Promise.all([
    prisma.idempotencyKey.count(),
    prisma.idempotencyKey.count({ where: { status: 'pending' } }),
    prisma.idempotencyKey.count({ where: { status: 'completed' } }),
    prisma.idempotencyKey.count({ where: { status: 'failed' } }),
    prisma.idempotencyKey.count({ where: { ttlAt: { lt: new Date() } } }),
  ]);
  
  return {
    total,
    pending,
    completed,
    failed,
    expired, // Should be 0 if GC is running
  };
}

