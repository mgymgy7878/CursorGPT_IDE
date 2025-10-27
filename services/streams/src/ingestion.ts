import { EventEmitter } from 'events';
import { prometheus } from './metrics.js';

export class StreamIngestion extends EventEmitter {
  private batchSize: number;
  private flushInterval: number;
  private batch: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(options: { batchSize?: number; flushInterval?: number } = {}) {
    super();
    this.batchSize = options.batchSize || 500;
    this.flushInterval = options.flushInterval || 100;
  }

  async ingest(event: any) {
    const startTime = Date.now();
    
    try {
      // Add to batch
      this.batch.push(event);
      
      // Check if batch is full
      if (this.batch.length >= this.batchSize) {
        await this.flush();
      }
      
      // Set flush timer if not already set
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => {
          this.flush();
        }, this.flushInterval);
      }
      
      const latency = Date.now() - startTime;
      prometheus.ingestLatency.observe({ 
        exchange: event.exchange, 
        channel: event.channel 
      }, latency);
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async flush() {
    if (this.batch.length === 0) return;
    
    const batchToFlush = [...this.batch];
    this.batch = [];
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    try {
      // Idempotent upsert to database
      await this.upsertBatch(batchToFlush);
      
      this.emit('batchFlushed', batchToFlush.length);
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async upsertBatch(batch: any[]) {
    // Idempotent upsert logic
    // Use event ID + timestamp as unique key
    const uniqueEvents = new Map();
    
    for (const event of batch) {
      const key = `${event.exchange}_${event.channel}_${event.timestamp}_${event.id}`;
      uniqueEvents.set(key, event);
    }
    
    // Database upsert
    for (const [key, event] of uniqueEvents) {
      await this.upsertEvent(event);
    }
  }

  private async upsertEvent(event: any) {
    // Database upsert implementation
    // This would be implemented with your database client
    console.log(`Upserting event: ${event.exchange}_${event.channel}_${event.timestamp}`);
  }
}
