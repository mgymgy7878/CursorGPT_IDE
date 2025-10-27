import { EventEmitter } from 'events';
import { OptimizerQueue, OptimizerJob } from "./optimizerQueue.js";
import { OptimizerPool, WorkerConfig } from "./optimizerPool.js";
import { optimizerMetrics } from "./metrics.js";

export interface OptimizerLimits {
  maxConcurrentJobs: number;
  maxQueueDepth: number;
  cpuLimitPercent: number;
  memoryLimitMB: number;
  stepLatencyLimitMs: number;
  queueWaitLimitMs: number;
}

export interface TokenBucket {
  tokens: number;
  capacity: number;
  refillRate: number;
  lastRefill: number;
}

export class OptimizerController extends EventEmitter {
  private queue: OptimizerQueue;
  private pool: OptimizerPool;
  private limits: OptimizerLimits;
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(limits: OptimizerLimits, workerConfig: WorkerConfig) {
    super();
    this.limits = limits;
    this.queue = new OptimizerQueue();
    this.pool = new OptimizerPool(workerConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.pool.on('jobCompleted', (job: OptimizerJob) => {
      this.emit('jobCompleted', job);
    });

    this.pool.on('jobFailed', (job: OptimizerJob, error: Error) => {
      this.emit('jobFailed', job, error);
    });

    this.pool.on('workerIdle', () => {
      this.processQueue();
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Process queue every 100ms

    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    await this.pool.shutdown();
    this.emit('stopped');
  }

  async enqueueJob(job: OptimizerJob): Promise<boolean> {
    // Check backpressure
    if (this.queue.size() >= this.limits.maxQueueDepth) {
      optimizerMetrics.optimizerPreemptionsTotal.inc({ reason: 'backpressure' });
      return false;
    }

    // Check fairness (token bucket)
    const userId = job.source; // Simplified user identification
    if (!this.checkTokenBucket(userId)) {
      optimizerMetrics.optimizerPreemptionsTotal.inc({ reason: 'fairness' });
      return false;
    }

    // Check resource limits
    if (!this.checkResourceLimits()) {
      optimizerMetrics.optimizerPreemptionsTotal.inc({ reason: 'resource_limit' });
      return false;
    }

    // Enqueue job
    const success = this.queue.enqueue(job);
    if (success) {
      this.emit('jobEnqueued', job);
    }

    return success;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    // Implementation would find and cancel the job
    // For now, just emit event
    this.emit('jobCanceled', { jobId });
    return true;
  }

  getStatus(): {
    queueDepth: number;
    workersRunning: number;
    workersIdle: number;
    isHealthy: boolean;
  } {
    const stats = this.pool.getStats();
    const queueDepth = this.queue.size();
    
    return {
      queueDepth,
      workersRunning: stats.running,
      workersIdle: stats.idle,
      isHealthy: queueDepth < this.limits.maxQueueDepth && 
                 stats.running <= this.limits.maxConcurrentJobs
    };
  }

  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    const job = this.queue.dequeue();
    if (!job) return;

    // Check deadline
    if (Date.now() > job.deadline) {
      job.status = 'canceled';
      optimizerMetrics.optimizerJobsTotal.inc({ 
        kind: job.kind, 
        source: job.source, 
        status: 'canceled' 
      });
      return;
    }

    // Execute job
    const success = await this.pool.executeJob(job);
    if (!success) {
      // Re-queue job if execution failed
      this.queue.enqueue(job);
    }
  }

  private checkTokenBucket(userId: string): boolean {
    const bucket = this.tokenBuckets.get(userId) || {
      tokens: 10,
      capacity: 10,
      refillRate: 1,
      lastRefill: Date.now()
    };

    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + (timePassed / 1000) * bucket.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.tokenBuckets.set(userId, bucket);
      return true;
    }

    return false;
  }

  private checkResourceLimits(): boolean {
    // Simplified resource check
    // In real implementation, would check actual CPU/memory usage
    return true;
  }
}
