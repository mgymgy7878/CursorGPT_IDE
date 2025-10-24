#!/usr/bin/env tsx
/**
 * Idempotency Key Garbage Collection
 * 
 * Deletes expired idempotency keys to prevent unbounded growth.
 * Run every hour via cron or PM2.
 * 
 * Usage:
 *   tsx tools/cron/gc-idempotency.ts
 * 
 * Cron (every hour):
 *   0 * * * * cd /app && tsx tools/cron/gc-idempotency.ts >> logs/gc.log 2>&1
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function gcIdempotencyKeys() {
  const startTime = Date.now();
  
  try {
    // Delete expired keys
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        ttlAt: {
          lt: new Date(),
        },
      },
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ GC Complete: ${result.count} keys deleted in ${duration}ms`);
    
    // Optional: Update Prometheus metric
    // setGauge('spark_idempotency_gc_last_run', Date.now() / 1000);
    // setGauge('spark_idempotency_gc_deleted_total', result.count);
    
    return result.count;
    
  } catch (error) {
    console.error('❌ GC Failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  gcIdempotencyKeys()
    .then(count => {
      console.log(`Garbage collection complete: ${count} keys deleted`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Garbage collection failed:', err);
      process.exit(1);
    });
}

export { gcIdempotencyKeys };

