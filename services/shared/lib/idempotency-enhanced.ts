import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

export interface IdempotencyRequest {
  key: string;
  operation: string;
  payload: any;
  ttlHours?: number;
}

export interface IdempotencyResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isDuplicate?: boolean;
  retryAfter?: number;
}

export class IdempotencyService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Execute idempotent operation with race condition prevention
   * Uses INSERT ... ON CONFLICT DO NOTHING for atomic "first request wins"
   */
  async execute<T>(
    request: IdempotencyRequest,
    operation: () => Promise<T>
  ): Promise<IdempotencyResult<T>> {
    const ttl = request.ttlHours || 48;
    const expiresAt = new Date(Date.now() + ttl * 60 * 60 * 1000);

    try {
      // Step 1: Try to insert pending record atomically
      const pendingRecord = await this.prisma.idempotencyKey.create({
        data: {
          key: request.key,
          operation: request.operation,
          status: 'PENDING',
          payload: request.payload,
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Step 2: We got the lock - execute operation
      try {
        const result = await operation();
        
        // Step 3: Mark as completed with result
        await this.prisma.idempotencyKey.update({
          where: { key: request.key },
          data: {
            status: 'COMPLETED',
            result: result,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: result,
        };
      } catch (operationError) {
        // Step 4: Mark as failed
        await this.prisma.idempotencyKey.update({
          where: { key: request.key },
          data: {
            status: 'FAILED',
            error: operationError instanceof Error ? operationError.message : 'Unknown error',
            updatedAt: new Date(),
          },
        });

        throw operationError;
      }
    } catch (insertError: any) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === 'P2002') {
        return this.handleDuplicateRequest(request.key);
      }
      throw insertError;
    }
  }

  /**
   * Handle duplicate request - check existing record
   */
  private async handleDuplicateRequest(key: string): Promise<IdempotencyResult> {
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!existing) {
      // Race condition edge case - retry
      return {
        success: false,
        error: 'Race condition detected',
        retryAfter: 1,
      };
    }

    // Check if completed
    if (existing.status === 'COMPLETED') {
      return {
        success: true,
        data: existing.result,
        isDuplicate: true,
      };
    }

    // Check if failed
    if (existing.status === 'FAILED') {
      return {
        success: false,
        error: existing.error || 'Previous operation failed',
        retryAfter: 2,
      };
    }

    // Still pending - return 409 with retry-after
    const retryAfter = Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000);
    return {
      success: false,
      error: 'Operation in progress',
      isDuplicate: true,
      retryAfter: Math.max(retryAfter, 2),
    };
  }

  /**
   * Clean up expired records (called by cron)
   */
  async cleanup(): Promise<{ deleted: number }> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            status: 'COMPLETED',
            updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days old
          }
        ],
      },
    });

    return { deleted: result.count };
  }

  /**
   * Get idempotency metrics for monitoring
   */
  async getMetrics() {
    const [total, pending, completed, failed, expired] = await Promise.all([
      this.prisma.idempotencyKey.count(),
      this.prisma.idempotencyKey.count({ where: { status: 'PENDING' } }),
      this.prisma.idempotencyKey.count({ where: { status: 'COMPLETED' } }),
      this.prisma.idempotencyKey.count({ where: { status: 'FAILED' } }),
      this.prisma.idempotencyKey.count({ where: { expiresAt: { lt: new Date() } } }),
    ]);

    return {
      total,
      pending,
      completed,
      failed,
      expired,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}

/**
 * HTTP Response helper for idempotency
 */
export function createIdempotencyResponse(result: IdempotencyResult) {
  if (result.success && result.isDuplicate) {
    return {
      status: 200,
      body: result.data,
      headers: {
        'X-Idempotency-Key': 'duplicate',
        'X-Idempotency-Status': 'cached',
      },
    };
  }

  if (!result.success && result.isDuplicate) {
    return {
      status: 409,
      body: { 
        error: result.error,
        code: 'DUPLICATE_REQUEST',
        retryAfter: result.retryAfter,
      },
      headers: {
        'Retry-After': result.retryAfter?.toString() || '2',
        'X-Idempotency-Status': 'pending',
      },
    };
  }

  if (!result.success) {
    return {
      status: 500,
      body: { error: result.error },
      headers: {
        'X-Idempotency-Status': 'error',
      },
    };
  }

  return {
    status: 200,
    body: result.data,
    headers: {
      'X-Idempotency-Status': 'new',
    },
  };
}
