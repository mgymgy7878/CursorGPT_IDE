import { PrismaClient } from '@prisma/client';
import { Counter, Histogram } from 'prom-client';

// Prometheus metrics
const outboxProcessed = new Counter({
  name: 'outbox_events_processed_total',
  help: 'Total number of outbox events processed',
  labelNames: ['topic', 'status'],
});

const outboxProcessingDuration = new Histogram({
  name: 'outbox_processing_duration_seconds',
  help: 'Duration of outbox event processing',
  labelNames: ['topic'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export interface OutboxEvent {
  id: string;
  topic: string;
  payload: any;
  createdAt: Date;
}

export interface OutboxPublisher {
  publish(topic: string, payload: any): Promise<void>;
}

export class OutboxDispatcher {
  constructor(
    private prisma: PrismaClient,
    private publisher: OutboxPublisher,
    private batchSize: number = 10,
    private pollIntervalMs: number = 1000
  ) {}

  /**
   * Start the dispatcher (run in background)
   */
  start() {
    setInterval(() => this.processBatch(), this.pollIntervalMs);
  }

  /**
   * Process a batch of pending events
   * Uses FOR UPDATE SKIP LOCKED for safe concurrent processing
   */
  async processBatch(): Promise<void> {
    const startTime = Date.now();

    try {
      // Fetch and lock pending events
      const events = await this.prisma.$queryRaw<OutboxEvent[]>`
        SELECT id, topic, payload, created_at as "createdAt"
        FROM outbox
        WHERE status = 'pending'
        AND retries < max_retries
        ORDER BY created_at ASC
        LIMIT ${this.batchSize}
        FOR UPDATE SKIP LOCKED
      `;

      if (events.length === 0) {
        return;
      }

      // Process each event
      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Outbox batch processing error:', error);
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      outboxProcessingDuration.observe({ topic: 'batch' }, duration);
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: OutboxEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Publish to external system (Kafka, Redis, etc.)
      await this.publisher.publish(event.topic, event.payload);

      // Mark as sent
      await this.prisma.outbox.update({
        where: { id: event.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      outboxProcessed.inc({ topic: event.topic, status: 'sent' });
    } catch (error) {
      // Increment retries
      const currentRetries = await this.prisma.outbox.findUnique({
        where: { id: event.id },
        select: { retries: true, maxRetries: true },
      });

      if (!currentRetries) {
        return;
      }

      const newRetries = currentRetries.retries + 1;
      const isFailed = newRetries >= currentRetries.maxRetries;

      await this.prisma.outbox.update({
        where: { id: event.id },
        data: {
          status: isFailed ? 'failed' : 'pending',
          retries: newRetries,
          failedAt: isFailed ? new Date() : undefined,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      outboxProcessed.inc({ 
        topic: event.topic, 
        status: isFailed ? 'failed' : 'retry' 
      });
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      outboxProcessingDuration.observe({ topic: event.topic }, duration);
    }
  }

  /**
   * Cleanup old sent events (call periodically via cron)
   */
  async cleanup(olderThanDays: number = 7): Promise<{ deleted: number }> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const result = await this.prisma.outbox.deleteMany({
      where: {
        status: 'sent',
        sentAt: {
          lt: cutoffDate,
        },
      },
    });

    return { deleted: result.count };
  }

  /**
   * Get metrics for monitoring
   */
  async getMetrics() {
    const [total, pending, sent, failed] = await Promise.all([
      this.prisma.outbox.count(),
      this.prisma.outbox.count({ where: { status: 'pending' } }),
      this.prisma.outbox.count({ where: { status: 'sent' } }),
      this.prisma.outbox.count({ where: { status: 'failed' } }),
    ]);

    const oldestPending = await this.prisma.outbox.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const lagMs = oldestPending 
      ? Date.now() - oldestPending.createdAt.getTime()
      : 0;

    return {
      total,
      pending,
      sent,
      failed,
      lagMs,
      lagSeconds: lagMs / 1000,
    };
  }
}

/**
 * Helper function to add event to outbox within a transaction
 */
export async function addToOutbox(
  prisma: PrismaClient,
  topic: string,
  payload: any
): Promise<void> {
  await prisma.outbox.create({
    data: {
      topic,
      payload,
      status: 'pending',
    },
  });
}

/**
 * Example usage in order service
 */
export async function createOrderWithOutbox(
  prisma: PrismaClient,
  orderData: any
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: orderData,
    });

    // Add to outbox for external notification
    await tx.outbox.create({
      data: {
        topic: 'order.created',
        payload: {
          orderId: order.id,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          timestamp: order.createdAt,
        },
        status: 'pending',
      },
    });
  });
}

/**
 * Redis publisher implementation
 */
export class RedisOutboxPublisher implements OutboxPublisher {
  constructor(private redis: any) {}

  async publish(topic: string, payload: any): Promise<void> {
    await this.redis.publish(topic, JSON.stringify(payload));
  }
}

/**
 * Kafka publisher implementation (placeholder)
 */
export class KafkaOutboxPublisher implements OutboxPublisher {
  constructor(private kafka: any) {}

  async publish(topic: string, payload: any): Promise<void> {
    await this.kafka.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }
}

/**
 * Console logger (for testing)
 */
export class ConsoleOutboxPublisher implements OutboxPublisher {
  async publish(topic: string, payload: any): Promise<void> {
    console.log(`[OUTBOX] ${topic}:`, JSON.stringify(payload, null, 2));
  }
}
